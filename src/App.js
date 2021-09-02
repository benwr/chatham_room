import logo from './logo.svg';
import './App.css';

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyA3NsMLi-R8d8S-F__VusmYGONkKTk9xr8",
  authDomain: "chatham-room.firebaseapp.com",
  projectId: "chatham-room",
  storageBucket: "chatham-room.appspot.com",
  messagingSenderId: "678062458841",
  appId: "1:678062458841:web:337f7c4b77bc78e062bbc8",
  measurementId: "G-G77SP8E9K7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
