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
      target_url = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/complete_login/" + encodeURIComponent(encodeURIComponent(window.location.pathname));
    } else {
      target_url = window.location.protocol + "//" + window.location.hostname + "/complete_login/" + encodeURIComponent(encodeURIComponent(window.location.pathname));
    }
    console.log(target_url);
    const actionCodeSettings = {
      url: target_url,
      handleCodeInApp: true,
    };
    window.localStorage.setItem("emailForSignIn", this.state.address);
    sendSignInLinkToEmail(this.props.auth, this.state.address, actionCodeSettings)
      .then(() => this.setState({sent: true}))
      .catch(e => {console.log(e); this.setState({error: true})});
  }

  render () {
    var message;
    if (this.state.sent) {
      message = <p>Email sent. Note that it may have been delivered to your spam folder.</p>
    } else if (this.state.error){
      message = <p>There was an error. You may wish to try again.</p>
    }

    return (
      <div id="login-form">
          You need to log in to access that page. We'll send you an email with a sign in link.
          <br />
          <br />
          <form onSubmit={this.handleSubmit}>
          <label>Email address: </label>
          <input value={this.state.address} onChange={this.handleTyping} />
          <button className="send-login" type="submit">Send Sign In Link</button>
          {message}
        </form>
      </div>
    )
  }
}

export { LoginContainer } ;
