import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import React from "react";
import { CreateRoom } from "./CreateRoom.js";
import { RoomContainer, LinkableContainer } from "./Room.js";
import { LoginContainer } from "./Login.js";
import { CompleteLoginContainer } from "./CompleteLogin.js";
import { AuthNav } from "./AuthBox.js";
import { VisitedList } from "./VisitedList.js";
import { About } from "./About.js";
import './App.css';

import { auth, db, functions } from "./utils/firebase.js";

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/room/:id">
          <AuthNav auth={auth}>
            <RoomContainer db={db} auth={auth} />
          </AuthNav>
        </Route>
        <Route path="/linkable/:id">
          <AuthNav auth={auth}>
            <LinkableContainer db={db} auth={auth} />
          </AuthNav>
        </Route>
        <Route path="/about">
          <AuthNav auth={auth}>
            <About />
          </AuthNav>
        </Route>
        <Route path="/create_room">
          <AuthNav auth={auth}>
            <CreateRoom db={db} auth={auth} functions={functions} />
          </AuthNav>
        </Route>
        <Route path="/login">
          <LoginContainer auth={auth} />
        </Route>
        <Route path="/complete_login">
          <CompleteLoginContainer auth={auth} />
        </Route>
        <Route path="/">
          <AuthNav auth={auth}>
            <VisitedList db={db} auth={auth} />
          </AuthNav>
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
