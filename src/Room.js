import { push, ref, set, onValue, serverTimestamp } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import React from "react";
import ReactDOM from "react-dom";
import { withRouter } from "react-router-dom";

class RoomContainerRouted extends React.Component {
  componentDidMount() {
    const id = this.props.match.params.id;
    const room_ref = ref(this.props.db, "rooms/" + id);

    onValue(room_ref, (snapshot) => {
      const data = snapshot.val();
      const domContainer = document.querySelector("#room");
      ReactDOM.render(<Room db={this.props.db} auth={this.props.auth} room_id={id} room={data} />, domContainer);
    })
  }

  render() {
    return <div id="room" />;
  }
}

var RoomContainer = withRouter(RoomContainerRouted);

const MAX_DEPTH=5;

class Room extends React.Component {
  constructor(props) {
    super(props);
    this.state = {"ROOT": {content: "", uncloaked: false}, "email": ""};
    this.handleTyping = this.handleTyping.bind(this);
    this.handleUncloak = this.handleUncloak.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleReply = this.handleReply.bind(this);
  }

  componentDidMount() {
    onAuthStateChanged(this.props.auth, (user) => {
      if (user && this.props.room.emails && this.props.room.emails.includes("," + user.email + ",")) {
        this.setState({"email": user.email})
        var visited_ref = ref(this.props.db, "users/" + user.uid + "/visited/" + this.props.room_id);
        set(visited_ref, {
          name: this.props.room.name,
          emails: this.props.room.emails,
          time: serverTimestamp(),
        });
      }
    })
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
    if (thread_id === "ROOT") {
      new_ref = push(ref(this.props.db, "rooms/" + this.props.room_id + "/messages"));
    } else {
      new_ref = push(ref(this.props.db, "rooms/" + this.props.room_id + "/messages/" + thread_id + "/children"));
    }
    if (this.state[thread_id].uncloaked) {
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
          />
        );
      }
    }

    return <div className="room">
        <h2>{this.props.room.name}</h2>
        In this room: <span className="email-list">{this.props.room.emails.slice(1, -1)}</span>
        <br />
        <br />
        {messages}
        <ReplyForm
          handleUncloak={this.handleUncloak}
          handleTyping={this.handleTyping}
          handleSubmit={this.handleSubmit}
          thread_id="ROOT"
          content={this.state["ROOT"].content}
          uncloaked={this.state["ROOT"].uncloaked}
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
  }

  componentDidMount() {
    this.inputref.focus();
    this.inputref.scrollIntoView({block: "center", behavior: "smooth"});
  }

  componentDidUpdate() {
    this.inputref.scrollIntoView({block: "center", behavior: "smooth"});
  }

  handleChange(event) {
    this.props.handleTyping(this.props.thread_id, event.target.value);
  }

  handleTickBox(event) {
    this.props.handleUncloak(this.props.thread_id, event.target.value);
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.handleSubmit(this.props.thread_id);
  }

  shouldComponentUpdate(nextProps) {
    return this.props.content !== nextProps.content || this.props.thread_id !== nextProps.thread_id
  }

  render() {
    return (<form className="message-form" onSubmit={this.handleSubmit}>
        <input className="message-input" ref={inputref => {this.inputref = inputref}} id={this.props.thread_id} type="text" value={this.props.content} onChange={this.handleChange} />
        <button className="message-button" type="submit">Send</button>
        <br />
        <label>
          Send Uncloaked:
          <input type="checkbox" value={this.props.uncloaked} onChange={this.handleTickBox} />
        </label>
      </form>)
  }

}

class Message extends React.Component {
  constructor(props) {
    super(props);
    this.handleClickReply = this.handleClickReply.bind(this);
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
      stamp = <a href={"#" + this.props.thread_id} id={this.props.thread_id} className="timestamp">{date + " " + time}</a>;
    } else {
      stamp = <span className="timestamp" />
    }

    var byline;
    if (this.props.m.author) {
      byline = <div className="byline">{this.props.m.author} @ {stamp}</div>
    } else {
      byline = <div className="byline">{stamp}</div>
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
        reply_content = React.createElement(ReplyForm, {
          handleUncloak: this.props.handleUncloak,
          handleTyping: this.props.handleTyping,
          handleSubmit: this.props.handleSubmit,
          thread_id: this.props.thread_id,
          content: this.props.replies[this.props.thread_id].content,
          uncloaked: this.props.replies[this.props.thread_id].uncloaked,
        });
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
        />);
      }
    }

    return <div className="message">
      {byline}
      {this.props.m.content}
      <br />
      {replies}
      {reply_content}
    </div>
  }

}

export { RoomContainer };
