import { push, ref, set, onValue, serverTimestamp } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import React from "react";
import md5 from "md5";
import TextareaAutosize from "react-textarea-autosize";
import { withRouter } from "react-router-dom";

class RoomContainerRouted extends React.Component {
  state = {};

  componentDidMount() {
    const id = this.props.match.params.id;
    const room_ref = ref(this.props.db, "/rooms/" + id);
    const deletion_ref = ref(this.props.db, "/delete_dates/room/" + id)

    onValue(room_ref, (snapshot) => {
      this.setState({data: snapshot.val()});
    })

    onValue(deletion_ref, (snapshot) => {
      this.setState({deletion_date: snapshot.val()});
    })
  }

  render() {
    if (this.state.data) {
      return <Room db={this.props.db} auth={this.props.auth} room_id={this.props.match.params.id} room={this.state.data} deletion_date={this.state.deletion_date} />;
    }
    else {
      return "Unable to load room. Are you logged in?"
    }
  }
}

class LinkableContainerRouted extends React.Component {
  state = {}

  componentDidMount() {
    const id = this.props.match.params.id;
    const room_ref = ref(this.props.db, "/linkables/" + id);
    const deletion_ref = ref(this.props.db, "/delete_dates/linkable/" + id)

    onValue(room_ref, (snapshot) => {
      this.setState({data: snapshot.val()});
    })

    onValue(deletion_ref, (snapshot) => {
      this.setState({deletion_date: snapshot.val()});
    })
  }

  render() {
    if (this.state.data) {
      return <Room db={this.props.db} auth={this.props.auth} linkable_id={this.props.match.params.id} room={this.state.data} deletion_date={this.state.deletion_date}/>;
    } else {
      return "Unable to load room. Are you logged in?";
    }
  }
}

var RoomContainer = withRouter(RoomContainerRouted);
var LinkableContainer = withRouter(LinkableContainerRouted);

const MAX_DEPTH=3;

function getStamps(messages, prefix="") {
  var result = [];
  for (const [id, message] of Object.entries(messages)) {
    const my_id = prefix + id;
    result.push([new Date(message.time), my_id]);
    if (message.children) {
      result.push(...getStamps(message.children, my_id + "/children/"))
    }
  }
  return result;
}

class Room extends React.Component {
  constructor(props) {
    super(props);

    var most_recent_messages;
    if (props.room.messages) {
      most_recent_messages = getStamps(props.room.messages);
      most_recent_messages.sort((e1, e2) => {return e2[0].getTime() - e1[0].getTime()});
    } else {
      most_recent_messages = [];
    }

    this.state = {
      "ROOT": {content: "", uncloaked: false},
      "email": "",
      globally_uncloaked: false,
      chiming: false,
      most_recent_messages: most_recent_messages.slice(0, 3),
    };
    this.handleTyping = this.handleTyping.bind(this);
    this.handleUncloak = this.handleUncloak.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleReply = this.handleReply.bind(this);
    this.handleGlobalUncloak = this.handleGlobalUncloak.bind(this);
    this.handleToggleChime = this.handleToggleChime.bind(this);
    this.registerMessage = this.registerMessage.bind(this);
    this.saveTranscript = this.saveTranscript.bind(this);
  }

  componentDidMount() {
    onAuthStateChanged(this.props.auth, (user) => {
      if (user) {
        this.setState({"email": user.email});
      }
      var visited_ref;
      if (this.props.room_id) {
        visited_ref = ref(this.props.db, "users/" + user.uid + "/visited/" + this.props.room_id);
      } else {
        visited_ref = ref(this.props.db, "users/" + user.uid + "/visited_linkables/" + this.props.linkable_id);
      }
      if (this.props.room.emails) {
        set(visited_ref, {
          name: this.props.room.name,
          emails: this.props.room.emails,
          time: serverTimestamp(),
        });
      } else {
        set(visited_ref, {
          name: this.props.room.name,
          time: serverTimestamp(),
        });
      }
    })
  }

  componentDidUpdate() {
    if (document.activeElement.tagName === "TEXTAREA") {
      document.activeElement.scrollIntoView({block: "center", behavior: "smooth"});
    }
  }

  handleTyping(thread_id, content) {
    var newstate;
    if (!this.state[thread_id]) {
      newstate = {content: content, uncloaked: false};
    } else {
      newstate = {content: content, uncloaked: this.state[thread_id].uncloaked}
    }
    this.setState({[thread_id]: newstate});
  }

  handleUncloak(thread_id, value) {
    var newstate;
    if (!this.state[thread_id]) {
      newstate = {content: "", uncloaked: false};
    } else {
      newstate = {content: this.state[thread_id].content, uncloaked: value}
    }
    this.setState({[thread_id]: newstate});
  }

  handleSubmit(thread_id) {
    var new_ref;
    var prefix;
    if (this.props.room_id) {
      prefix = "rooms/" + this.props.room_id;
    } else {
      prefix = "linkables/" + this.props.linkable_id;
    }
    if (thread_id === "ROOT") {
      new_ref = push(ref(this.props.db, prefix + "/messages"));
    } else {
      new_ref = push(ref(this.props.db, prefix + "/messages/" + thread_id + "/children"));
    }
    if (this.state[thread_id].uncloaked || this.state.globally_uncloaked) {
      set(new_ref, {
        content: this.state[thread_id].content,
        author: this.state.email,
        time: serverTimestamp(),
        children: {}
      });
    } else {
      set(new_ref, {
        content: this.state[thread_id].content,
        time: serverTimestamp(),
        children: {}
      });
    }
    var state_update = {[thread_id]: {content: "", uncloaked: this.state[thread_id].uncloaked}};
    this.setState(state_update);
  }

  handleReply(thread_id) {
    this.setState({
      [thread_id]: {content: "", uncloaked: false}
    });
  }

  handleToggleChime(event) {
    this.setState({chiming: event.target.checked});
  }

  handleGlobalUncloak(event) {
    this.setState({globally_uncloaked: event.target.checked});
  }

  registerMessage(id, stamp) {
    const mrm = this.state.most_recent_messages;
    if (mrm.length > 2 && [mrm[0][1], mrm[1][1], mrm[2][1]].includes(id)) {
      return;
    }
    var new_most_recent = mrm.concat([[stamp, id]])
    new_most_recent.sort((e1, e2) => {return e2[0].getTime() - e1[0].getTime()});
    this.setState({most_recent_messages: new_most_recent.slice(0, 3)});
  }

  saveTranscript(event) {
    event.preventDefault();
    var html = document.getElementById("messages").innerHTML;
    var css = [].slice.call(document.getElementsByTagName("style")).map(s => s.outerHTML);

    var link_hrefs = [].slice.call(document.getElementsByTagName("link")).flatMap(
      l => {
        if (l.getAttribute("rel") === "stylesheet") {
          return [l.getAttribute("href")];
        } else {
          return [];
        }
      }
    );
    var req_promises = [];
    for (const url of link_hrefs) {
      req_promises.push(fetch(url).then(response => response.text()))
    }
    Promise.all(req_promises).then((stylesheets) =>  {
      for (const stylesheet of stylesheets) {
        css.push("<style>\n" + stylesheet + "\n</style>");
      }
      var header = "<html><head>" + css.join("\n") + "</head><body><h1>" + this.props.room.name + "</h1>";
      var footer = "</body></html>"
      var tempEl = document.createElement("a");
      tempEl.href = "data:attachment/text," + encodeURIComponent(header + html + footer);
      tempEl.target = "_blank";
      tempEl.download = this.props.room.name + ".html";
      tempEl.click();
    });
  }

  render() {
    let messages = [];

    if (this.props.room.messages) {
      for (const [k, v] of Object.entries(this.props.room.messages)) {
        messages.push(
          <Message
            m={v}
            depth={1}
            key={k}
            thread_id={k}
            replies={this.state}
            handleTyping={this.handleTyping}
            handleUncloak={this.handleUncloak}
            handleSubmit={this.handleSubmit}
            handleReply={this.handleReply}
            globally_uncloaked={this.state.globally_uncloaked}
            chime={this.state.chiming}
            registerMessage={this.registerMessage}
            most_recent_messages={this.state.most_recent_messages}
          />
        );
      }
    }

    if (this.props.room.emails) {
      const emails = this.props.room.emails.slice(1, -1).split(",");
      var display_emails = [];
      for (const email of emails) {
        display_emails.push(<img key={email + "avatar"} alt={""} className="avatar" src={"https://www.gravatar.com/avatar/" + md5(email) + "?d=retro"} />);
        display_emails.push(email);
        display_emails.push(", ");
      }
    } else {
      display_emails = ["This room is open to any logged in user with ", <a key="1" href={window.location.href}>the link</a>, ".", <br key="2" />];
    }

    var deletion_message = null;
    if (this.props.deletion_date) {
      var date = new Date(this.props.deletion_date);
      deletion_message = "This room is scheduled to be deleted after " + date.toLocaleTimeString() + " on " + date.toLocaleDateString();
    }

    return <div id="room">
        <div className="room-info">
          <h2>{this.props.room.name}</h2>
          <div className="email-list">
            {display_emails.slice(0, -1)}
            <br />
            <br />
            <button className="save-transcript" onClick={this.saveTranscript}>Save Transcript</button>
            {deletion_message}
            <br />
            <label>Uncloak my messages by default: <input type="checkbox" checked={this.state.globally_uncloaked} onChange={this.handleGlobalUncloak} /></label>
            <label className="chime-box">Chime on new messages: <input type="checkbox" checked={this.state.chiming} onChange={this.handleToggleChime} /></label>
          </div>
          </div>
        <br />
        <br />
        <div id="messages">
        {messages}
        </div>
        <ReplyForm
          handleUncloak={this.handleUncloak}
          handleTyping={this.handleTyping}
          handleSubmit={this.handleSubmit}
          thread_id="ROOT"
          content={this.state["ROOT"].content}
          uncloaked={this.state["ROOT"].uncloaked}
          globally_uncloaked={this.state.globally_uncloaked}
      />
      </div>
  }

}

class ReplyForm extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleTickBox = this.handleTickBox.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  componentDidMount() {
    this.inputref.focus();
    this.inputref.scrollIntoView({block: "center", behavior: "smooth"});
  }

  componentDidUpdate() {
    // this.inputref.scrollIntoView({block: "center", behavior: "smooth"});
  }

  handleChange(event) {
    this.props.handleTyping(this.props.thread_id, event.target.value);
  }

  handleTickBox(event) {
    this.props.handleUncloak(this.props.thread_id, event.target.checked);
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.handleSubmit(this.props.thread_id);
  }

  handleKeyDown(event) {
    if (event.keyCode === 13 && !event.shiftKey) {
      event.preventDefault();
      this.props.handleSubmit(this.props.thread_id);
    }
  }

  shouldComponentUpdate(nextProps) {
    return this.props.content !== nextProps.content || this.props.thread_id !== nextProps.thread_id || this.props.uncloaked !== nextProps.uncloaked || this.props.globally_uncloaked !== nextProps.globally_uncloaked
  }

  render() {
    var uncloak_info;
    if (this.props.globally_uncloaked) {
      uncloak_info = (
        <label className="uncloak">
        (Default uncloaked);
        </label>
      )
    } else {
      uncloak_info = (
        <label className="uncloak">
          (Uncloaked:
            <input type="checkbox" checked={this.props.uncloaked} onChange={this.handleTickBox} />)
        </label>
      );
    }
    return (<form className="message-form" onSubmit={this.handleSubmit}>
        <TextareaAutosize className="message-input" ref={inputref => {this.inputref = inputref}} id={this.props.thread_id} type="text" value={this.props.content} onChange={this.handleChange} onKeyDown={this.handleKeyDown} />
        <br />
        <button className="message-button" type="submit">Send</button>
        {uncloak_info}
      </form>)
  }
}

class Message extends React.Component {
  constructor(props) {
    super(props);
    this.handleClickReply = this.handleClickReply.bind(this);
  }

  componentDidMount() {
    if (this.props.chime) {
      (new Audio("/bell.wav")).play();
    }
    this.props.registerMessage(this.props.thread_id, new Date(this.props.m.time));
  }

  handleClickReply(event) {
    event.preventDefault();
    this.props.handleReply(this.props.thread_id);
  }

  render() {
    var stamp;
    if (this.props.m.time) {
      const dt = new Date(this.props.m.time);
      const date = dt.toDateString();
      const time = dt.toLocaleTimeString();
      const stamp_style = {};
      const mrm = this.props.most_recent_messages;
      if (mrm && [mrm[0][1], mrm[1][1], mrm[2][1]].includes(this.props.thread_id)) {
        stamp_style.fontWeight = "bold";
        stamp_style.color = "#000";

      }
      stamp = (<a href={"#" + this.props.thread_id} id={this.props.thread_id} style={stamp_style} className="timestamp">
        {"@ " + date + " " + time}
      </a>);
    } else {
      stamp = <span className="timestamp" />
    }

    const indentation = <span className="invisible-indent">{"\u00A0\u00A0".repeat(this.props.depth - 1)}</span>

    var byline;
    if (this.props.m.author) {
      byline = (<div className="byline">
          {indentation}
          <img alt={""} className="avatar" src={"https://www.gravatar.com/avatar/" + md5(this.props.m.author) + "?d=retro"} />
          {this.props.m.author} {stamp}
        </div>);
    } else {
      byline = <div className="byline">{indentation}{stamp}</div>;
    }
    var reply_content;
    if (this.props.depth < MAX_DEPTH) {
      if (this.props.replies[this.props.thread_id] === undefined) {
        reply_content = React.createElement("a", {
          href: "#",
          className: "reply-link",
          onClick: this.handleClickReply
        }, "⮑ reply");
      } else {
        reply_content = <ReplyForm
          handleUncloak={this.props.handleUncloak}
          handleTyping={this.props.handleTyping}
          handleSubmit={this.props.handleSubmit}
          thread_id={this.props.thread_id}
          content={this.props.replies[this.props.thread_id].content}
          uncloaked={this.props.replies[this.props.thread_id].uncloaked || this.props.globally_uncloaked}
          globally_uncloaked={this.props.globally_uncloaked}
          most_recent_messages={this.props.most_recent_messages}
        />;
      }
    } else {
      reply_content = null;
    }

    var replies = [];

    if (this.props.m.children) {
      for (const [k, v] of Object.entries(this.props.m.children)) {
        replies.push(<Message
          m={v}
          depth={this.props.depth + 1}
          key={this.props.thread_id + '/children/' + k}
          thread_id={this.props.thread_id + '/children/' + k}
          replies={this.props.replies}
          handleTyping={this.props.handleTyping}
          handleSubmit={this.props.handleSubmit}
          handleReply={this.props.handleReply}
          handleUncloak={this.props.handleUncloak}
          globally_uncloaked={this.props.globally_uncloaked}
          chime={this.props.chime}
          registerMessage={this.props.registerMessage}
          most_recent_messages={this.props.most_recent_messages}
        />);
      }
    }


    var content_lines = this.props.m.content.split("\n").flatMap((e, i) => [<br key={i} />, indentation, e]).slice(1);

    return <div className="message">
      {byline}
      {content_lines}
      <br />
      {replies}
      {reply_content}
    </div>
  }
}

export { RoomContainer, LinkableContainer };
