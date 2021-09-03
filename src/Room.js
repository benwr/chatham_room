import { push, ref, set, onValue } from "firebase/database";
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
    this.state = {"ROOT": ""};
    this.handleTyping = this.handleTyping.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleReply = this.handleReply.bind(this);
  }

  componentDidMount() {
    onAuthStateChanged(this.props.auth, (user) => {
      if (user && this.props.room.emails && this.props.room.emails.includes("," + user.email + ",")) {
        var visited_ref = ref(this.props.db, "users/" + user.uid + "/visited/" + this.props.room_id);
        set(visited_ref, {
          name: this.props.room.name,
          emails: this.props.room.emails,
          time: (new Date()).toUTCString(),
        });
      }
    })
  }

  handleTyping(thread_id, content) {
    this.setState({
      [thread_id]: content
    });
  }

  handleSubmit(thread_id) {
    var new_ref;
    if (thread_id === "ROOT") {
      new_ref = push(ref(this.props.db, "rooms/" + this.props.room_id + "/messages"));
    } else {
      new_ref = push(ref(this.props.db, "rooms/" + this.props.room_id + "/messages/" + thread_id + "/children"));
    }
    set(new_ref, {
      content: this.state[thread_id],
      time: (new Date()).toUTCString(),
      children: {}
    });
    var state_update = {[thread_id]: ""};
    this.setState(state_update);
  }

  handleReply(thread_id) {
    this.setState({
      [thread_id]: ""
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
          handleTyping={this.handleTyping}
          handleSubmit={this.handleSubmit}
          thread_id="ROOT"
          content={this.state["ROOT"]} />
      </div>
  }

}

class ReplyForm extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
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

  handleSubmit(event) {
    event.preventDefault();
    this.props.handleSubmit(this.props.thread_id);
  }

  shouldComponentUpdate(nextProps) {
    return this.props.content !== nextProps.content || this.props.thread_id !== nextProps.thread_id
  }

  render() {
    return React.createElement("form", {
      className: "message-form",
      onSubmit: this.handleSubmit
    }, React.createElement("input", {
      className: "message-input",
      ref: (inputref) => {this.inputref = inputref},
      id: this.props.thread_id,
      type: "text",
      value: this.props.content,
      onChange: this.handleChange
    }), React.createElement("button", {
      className: "message-button",
      type: "submit"
    }, "Send"));
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
          handleTyping: this.props.handleTyping,
          handleSubmit: this.props.handleSubmit,
          thread_id: this.props.thread_id,
          content: this.props.replies[this.props.thread_id]
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
      {stamp}
      {this.props.m.content}
      <br />
      {replies}
      {reply_content}
    </div>
  }

}

export { RoomContainer };
