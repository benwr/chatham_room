import { ref, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";
import React from "react";

class VisitedList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {visits: []}
  }

  componentDidMount() {
    onAuthStateChanged(this.props.auth, (user) => {
      if (user) {
        var visited_ref = ref(this.props.db, "users/" + user.uid + "/visited");
        onValue(visited_ref, (snapshot) => {
          const data = snapshot.val();
          this.setState({visits: data});
        });
        var visited_linkables_ref = ref(this.props.db, "users/" + user.uid + "/visited_linkables");
        onValue(visited_linkables_ref, (snapshot) => {
          const data = snapshot.val();
          this.setState({linkables: data});
        });
      }
    });

  }

  render() {
    var links = [];

    if (this.state.visits) {
      for (const [k, v] of Object.entries(this.state.visits)) {
        links.push(<li key={k}><Link to={"/room/" + k} >{v.name}</Link> (
            {v.emails.slice(1, -1).split(",").join(", ")})
          </li>);
      }
    }

    var linkables = [];
    if (this.state.linkables) {
      for (const [k, v] of Object.entries(this.state.linkables)) {
        linkables.push(<li key={k}><Link to={"/linkable/" + k} >{v.name}</Link></li>);
      }
    }
    return (
      <div className="visited-list">
        <h2>Known-user rooms you've visited</h2>
        <ul>
          {links}
        </ul>
        <h2>Linkable rooms you've visited</h2>
        <ul>
          {linkables}
        </ul>
      </div>
    )
  }
}

export { VisitedList };
