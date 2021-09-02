import React from "react";

import { sendSignInLinkToEmail } from "firebase/auth";

class LoginContainer extends React.Component {
  constructor(props) {
    super(props)
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleTyping = this.handleTyping.bind(this);
    this.state = {address: "", sent: false, error: false}
  }

  handleTyping(event) {
    event.preventDefault();
    this.setState({address: event.target.value});
  }

  handleSubmit(event) {
    event.preventDefault();
    var target_url;
    if (window.location.port) {
      target_url = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/complete_login";
    } else {
      target_url = window.location.protocol + "//" + window.location.hostname + "/complete_login";
    }
    const actionCodeSettings = {
      url: target_url,
      handleCodeInApp: true,
    };
    window.localStorage.setItem("emailForSignIn", this.state.address);
    sendSignInLinkToEmail(this.props.auth, this.state.address, actionCodeSettings)
      .then(() => this.setState({sent: true}))
      .catch(() => this.setState({error: true}));
  }

  render () {
    var message;
    if (this.state.sent) {
      message = <p>Email sent.</p>
    } else if (this.state.error){
      message = <p>There was an error. You may wish to try again.</p>
    }

    return (
      <div id="login-form">
        <form onSubmit={this.handleSubmit}>
          <label>Your email address: </label>
          <input value={this.state.address} onChange={this.handleTyping} />
          <button type="submit">Send Login Link</button>
          {message}
        </form>
      </div>
    )
  }
}

export { LoginContainer } ;
