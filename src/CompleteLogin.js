import React from "react";

import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { withRouter, Redirect } from "react-router-dom";

class CompleteLoginContainerRouted extends React.Component {
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
            this.setState({logged_in: true});
          }
        ).catch(() => this.setState({error: true}));
      }
    }
  }
  render() {
    var message;
    if (!this.state.logged_in && !this.state.error) {
        message = <p>Attempting to verify email...</p>
    } else if (this.state.error) {
        message = (<p>Something went wrong. Please <a href="/login">try signing in again</a>.
             Note that you can only use each sign in link one time.</p>
        );
    } else if (this.props.match.params.target) {
      console.log(this.props.match.params.target);
      console.log(decodeURIComponent(this.props.match.params.target));
      return <Redirect to={decodeURIComponent(this.props.match.params.target)} />
    } else {
      return <Redirect to="/" />
    }
    return <div id="wrapper">{message}</div>
  }
}

const CompleteLoginContainer = withRouter(CompleteLoginContainerRouted);

export { CompleteLoginContainer };
