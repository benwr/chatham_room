import React from "react";

class About extends React.Component {
  render() {
    return (<div id="about">
      <h1>Chatham Room</h1>
      <p>A Chatham Room is an anonymous, invite-only chat room.</p>

      <h2>How it works</h2>
      <p>First, log in using the email you'd like to use with the service.
      Then, create your Chatham Room. Give it a name, and choose the email addresses of the
      people you'd like to be in the room with you. When you click "Create", you'll
      be redirected to the chat room. Share the link to this room with your friends.</p>

      <p>
      Once you've shared the link with them, the people whose email addresses you indicated
      can see the Chatham Room and send messages. But no one can tell who said what. This idea is
      based on the <a href="https://en.wikipedia.org/wiki/Chatham_House_Rule">Chatham House Rule</a>,
      which is designed to allow conversations on controversial topics, or topics about which
      people might otherwise be embarassed to share their opinions.
      </p>

      <p>
      Chatham Room is a work in progress. Please report any bugs
      on <a href="https://github.com/benwr/chatham_room">our Github</a>.
      </p>
      </div>
    );
  }
}

export { About };
