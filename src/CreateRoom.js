import React from "react";
import { push, ref, set } from "firebase/database";
import { uuid} from "uuidv4";
import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";

class CreateRoom extends React.Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleEmailsChange = this.handleEmailsChange.bind(this);
    this.handleLinkableChange = this.handleLinkableChange.bind(this);
    this.handleDeleteLaterChange = this.handleDeleteLaterChange.bind(this);
    this.handleDeleteDateChange = this.handleDeleteDateChange.bind(this);
    this.state = {logged_in: false, name: "", emails: "", linkable: false, delete_later: false, delete_date: {} };
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

  handleLinkableChange(event) {
    this.setState({linkable: event.target.checked});
  }

  handleDeleteLaterChange(event) {
    this.setState({delete_later: event.target.checked});
  }

  handleDeleteDateChange(d) {
    this.setState({delete_date: d});
  }

  handleSubmit(event) {
    event.preventDefault();
    var room_type;
    var new_id;
    var new_ref;
    if (this.state.linkable) {
      room_type = "linkable";
      new_id = uuid() + "-" + uuid();
      new_ref = ref(this.props.db, "linkables/" + new_id);
    } else {
      room_type = "room";
      new_ref = push(ref(this.props.db, "rooms"));
      new_id = new_ref.key;
    }

    var new_room = {
      messages: {},
      name: this.state.name,
    }

    var promises = [];

    if (this.state.delete_later && typeof this.state.delete_date !== "string") {
      var deletion_date_ref = ref(this.props.db, "/delete_dates/" + room_type + "/" + new_id);
      promises.push(set(deletion_date_ref, this.state.delete_date.format()));
    }

    var email_list = null;
    if (!this.state.linkable) {
      const email_list = this.state.emails.split(/[\s,]+/);
      const emails = "," + email_list.join(",") + ",";
      new_room.emails = emails;
    }

    promises.push(set(new_ref, new_room));

    Promise.all(promises).then(values => {
      if (email_list) {
        const sendInvitation = httpsCallable(this.props.functions, "sendInvitation");
        return sendInvitation({
          targets: email_list,
          room_name: this.state.name,
          room_id: new_ref.key
        }, this.props.auth)
      }
    }).then(values => {
      window.location.href = "/" + room_type + "/" + new_id;
    }).catch(e => {
      console.log(e);
      window.location.href = "/" + room_type + "/" + new_id;
    });
  }

  render() {
    if (!this.state.logged_in) {
      return <p>Please log in to create a room.</p>
    }

    var datetime;
    if (this.state.delete_later) {
      datetime = <Datetime input={false} value={this.state.delete_date} onChange={this.handleDeleteDateChange} />;
    } else {
      datetime = null;
    }
    return (
      <div id="create-room-form">
      <form onSubmit={this.handleSubmit}>
        <table className="form">
        <tbody>
        <tr><td className="left-form">Room Name:</td><td>
          <input id="room_name" type="text" value={this.state.name} onChange={this.handleNameChange} />
        </td></tr>
        <tr><td className="left-form">Delete room on a pre-specified date:<br /> (deleted within 6 hours of specified time; can't be changed later)</td>
          <td>
          <input id="delete_later" type="checkbox" checked={this.state.delete_later} onChange={this.handleDeleteLaterChange} />
          {datetime}
          </td>
        </tr>
        <tr><td className="left-form">Room with unknown participants: <br /> (get shareable link)</td><td>
          <input id="linkable" type="checkbox" checked={this.state.linkable} onChange={this.handleLinkableChange} />
        </td>
        </tr>
        <tr>
        <td className="left-form">
        User Emails: <br /> (separated by commas or spaces)
        </td>
        <td>
          <textarea id="user_emails" cols="45" rows="3" disabled={this.state.linkable} value={this.state.emails} onChange={this.handleEmailsChange} />
        </td>
        </tr>
        <tr>
        <td style={{textAlign: "right"}}><button type="submit" disabled={!this.state.name || (this.state.delete_later && typeof this.state.delete_date === "string")}>Create</button></td>
        </tr>
        </tbody>
        </table>
      </form>
      </div>
    );
  }
}

export { CreateRoom };
