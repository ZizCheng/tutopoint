import React from "react";
import ReactDOM from "react-dom";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  NavLink,
  Redirect
} from "react-router-dom";
import SVG from "react-inlinesvg";

import profileAPI from "../api/profile.js";

import Dashboard from "./dashboard.jsx";
import Appointments from './appointments.jsx'

import profileStore from '../store/profileStore.js';

import "./theme.sass";
import "./app.scss";
import emptyProfileIcon from "../data/images/emptyProfilePic.png";
import tutologo from "../data/images/tutologo.png";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { profile: null, hidden: false };

    this.toggleSideBarMobile = this.toggleSideBarMobile.bind(this);
  }

  toggleSideBarMobile() {
    this.setState({
      hidden: !this.state.hidden
    });
  }

  componentDidMount() {
    profileAPI.getProfile().then(profile => {
      console.log(profile);
      profileStore.dispatch({type: 'Initialize', data: profile});
    });

    profileStore.subscribe(() => {
      this.setState({profile: profileStore.getState()})
    })
  }

  render() {
    return (
      <Router>
        <Redirect to="/dashboard" />
        <div className="container is-fluid">
          <nav
            className="navbar is-transparent"
            role="navigation"
            aria-label="main navigation"
          >
            <div className="navbar-brand">
              
              <a className="navbar-item is-size-4" href="https://tutopoint.com">
              <span className="icon is-large">
                <img src={tutologo}/>
              </span>
                TUTOPOINT
              </a>

              <a
                onClick={this.toggleSideBarMobile}
                role="button"
                className="navbar-burger burger"
              >
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
              </a>
            </div>

            <div className="navbar-menu">
              <div className="navbar-end">
                <div className="navbar-item is-size-4">
                  <div className="buttons">
                    <NavLink
                      className="button is-light"
                      activeClassName="is-active"
                      to="/logout"
                    >
                      Log Out
                    </NavLink>
                  </div>
                </div>
                <div id="profilePicture" className="navbar-brand">
                  <figure className="image is-48x48">
                    <img
                      className="is-rounded"
                      src={
                        this.state.profile?.profilePic
                          ? this.state.profile.profilePic
                          : emptyProfileIcon
                      }
                    ></img>
                  </figure>
                </div>
              </div>
            </div>
          </nav>
          <div className="columns">
            <div
              className={`column is-1 ${
                this.state.hidden ? "scale-up-ver-top" : "is-hidden-mobile"
              }`}
            >
              <aside className="menu">
                <ul className="menu-list">
                  <li>
                    <NavLink activeClassName="is-active" to="/dashboard">
                      Dashboard
                    </NavLink>
                  </li>
                  <li>
                    <NavLink activeClassName="is-active" to="/appointments">
                      Appointments
                    </NavLink>
                  </li>
                  <li>
                    <NavLink activeClassName="is-active" to="/documents">
                      Documents
                    </NavLink>
                  </li>
                  <li>
                    <NavLink activeClassName="is-active" to="/discover">
                      Discover
                    </NavLink>
                  </li>
                  <li>
                    <NavLink activeClassName="is-active" to="/balance">
                      Balance
                    </NavLink>
                  </li>
                  <li>
                    <NavLink activeClassName="is-active" to="/logout">
                      Log Out
                    </NavLink>
                  </li>
                </ul>
              </aside>
            </div>
            <div className="column">
              <Switch>
                <Route path="/Dashboard">
                  <Dashboard />
                </Route>
                <Route path="/Appointments">
                  <Appointments/>
                </Route>
                <Route path="/Documents">
                  <Home />
                </Route>
                <Route path="/Discover">
                  <Home />
                </Route>
                <Route path="/Balance">
                  <Home />
                </Route>
                <Route path="/Logout">
                  <Logout />
                </Route>
              </Switch>
            </div>
          </div>
        </div>
      </Router>
    );
  }
}

function Home() {
  return <h2>Home</h2>;
}

function About() {
  return <h2>About</h2>;
}

function Users() {
  return <h2>Users</h2>;
}

function Logout() {
  window.location.href = "/logout";
}

export default App;
