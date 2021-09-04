import React from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { About } from "./About.js";
import { LoginContainer } from "./Login.js";

class Nav extends React.Component {
  render() {
    return (
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/create_room">Create Room</Link>
        {this.props.children}
      </nav>
    );
  }
}

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
          <Nav>
            <button onClick={this.logout}>Log out {this.state.user.email}</button>
          </Nav>
          {this.props.children}
        </div>
      );
    } else {
      return (<div id="wrapper">
        <LoginContainer auth={this.props.auth} />
        <About />
      </div>);
    }
  }
}

export { AuthNav, Nav };
