import React from "react";

import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";

class CompleteLoginContainer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {logged_in: false, error: false}
  }

  componentDidMount() {
    if (isSignInWithEmailLink(this.props.auth, window.location.href)) {
      if (!this.state.logged_in) {
        let email = window.localStorage.getItem("emailForSignIn");
        if (!email) {
          email = window.prompt("Please provide your email for confirmation.");
        }
        signInWithEmailLink(this.props.auth, email, window.location.href).then(
          (result) => {
            window.localStorage.removeItem("emailForSignIn")
            this.setState({logged_in: true});
          }
        ).catch(() => this.setState({error: true}));
      }
    }
  }
  render() {
    if (!this.state.logged_in && !this.state.error) {
        return <p>Attempting to verify email...</p>
    } else if (this.state.error) {
        return (
          <p>Something went wrong. Please <a href="/login">try signing in again</a>.
             Be sure to be consistent about which email address you're using.</p>
        );
    } else {
        window.location.href = "/";
        return <p>Logged in successfully</p>
    }
  }
}

export { CompleteLoginContainer };
