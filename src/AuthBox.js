import React from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { About } from "./About.js";

class AuthNav extends React.Component {
  constructor(props) {
    super(props);
    this.state = {user: false};
    this.logout = this.logout.bind(this);
  }

  componentDidMount() {
    onAuthStateChanged(this.props.auth, (user) => {
      this.setState({user: user});
    });
  }

  logout(event) {
    event.preventDefault();
    signOut(this.props.auth).then(() => this.setState({user: false})).catch();
  }

  render() {
    if (this.state.user) {
      return (
        <div id="wrapper">
          <nav>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/create_room">Create Room</Link>
            <button onClick={this.logout}>Log out {this.state.user.email}</button>
          </nav>
          {this.props.children}
        </div>
      );
    } else {
      return (<div id="wrapper">
        <nav><Link to="/login">Log in or sign up</Link></nav>
        <About />
      </div>);
    }
  }
}

export { AuthNav };
