import React from "react";
import { push, ref, set } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";

class CreateRoom extends React.Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleEmailsChange = this.handleEmailsChange.bind(this);
    this.state = {logged_in: false, name: "", emails: "" };
  }

  handleNameChange(event) {
    event.preventDefault();
    this.setState({name: event.target.value});
  }

  componentDidMount() {
    onAuthStateChanged(this.props.auth, (user) => {
      if (user) {
        this.setState({logged_in: true, emails: user.email});
      } else {
        this.setState({logged_in: false, emails: ""});
      }
    });
  }

  handleEmailsChange(event) {
    event.preventDefault();
    this.setState({emails: event.target.value});
  }

  handleSubmit(event) {
    event.preventDefault();
    var new_ref = push(ref(this.props.db, "rooms"));
    const email_list = this.state.emails.split(/[\s,]+/);

    const emails = "," + email_list.join(",") + ",";
    set(new_ref, {
      messages: {},
      name: this.state.name,
      emails: emails,
    }).then(() => {
      const sendInvitation = httpsCallable(this.props.functions, "sendInvitation");
      sendInvitation({
        targets: email_list,
        room_name: this.state.name,
        room_id: new_ref.key
      }, this.props.auth).then(() => {
        window.location.href = "/room/" + new_ref.key;
      }).catch((e) => {
        console.log(e);
        window.location.href = "/room/" + new_ref.key;
      });
    });
  }

  render() {
    if (!this.state.logged_in) {
      return <p>Please log in to create a room.</p>
    }
    return (
      <div id="create-room-form">
      <form onSubmit={this.handleSubmit}>
        <label>Room Name: </label>
        <br />
        <input id="room_name" type="text" value={this.state.name} onChange={this.handleNameChange} />
        <br />
        <label>User Emails (separated by commas or spaces): </label>
        <br />
        <textarea id="user_emails" cols="45" rows="3" value={this.state.emails} onChange={this.handleEmailsChange} />
        <br />
        <button type="submit">Create</button>
      </form>
      </div>
    );
  }
}

export { CreateRoom };
