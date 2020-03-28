import React, { Lazy, Suspense } from "react";
import ReactDOM from "react-dom";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  NavLink,
  Link,
  Redirect,
  withRouter,
} from "react-router-dom";
import SVG from "react-inlinesvg";

import profileAPI from "../api/profile.js";

import Dashboard from "./dashboard.jsx";
import Appointments from "./appointments.jsx";
import Balance from "./balance.jsx";
const  Discover = React.lazy(() => import("./discover.jsx"))
import Documents from "./document.jsx";
import DocumentEdit from "./DocumentEdit.jsx";
import Profile from "./profile.jsx";
import Session from "./session.jsx";
import Loading from "./loading.jsx";

import profileStore from "../store/profileStore.js";

import "./theme.sass";
import "./app.scss";
import emptyProfileIcon from "../data/images/emptyProfilePic.png";
import tutologo from "../data/images/tutologo.png";
import checkmark from "../data/images/checkmark.png";

import introJs from "intro.js";
import "intro.js/introjs.css";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { profile: null, hidden: false, loaded: false };

    this.toggleSideBarMobile = this.toggleSideBarMobile.bind(this);
    this.closeTutorial = this.closeTutorial.bind(this);
    this.goToProfile = this.goToProfile.bind(this);
  }

  toggleSideBarMobile() {
    this.setState({
      hidden: !this.state.hidden
    });
  }

  componentDidMount() {
    profileAPI.getProfile().then(profile => {
      const intro = introJs();
      console.log(profile);
      profileStore.dispatch({ type: "Update", data: profile });
      this.setState({ loaded: true }, function() {
        if (this.state.profile?.__t == "clients" && !this.state.profile?.tutorialHidden) {
          this.toggleSideBarMobile();
          intro.setOption("scrollToElement", true);
          intro.start();
          const that = this;
          intro.oncomplete(function() {
            that.closeTutorial();
          });
          intro.onexit(function() {
            that.closeTutorial();
          });
        }
      });

    });

    profileStore.subscribe(() => {
      this.setState({ profile: profileStore.getState() });
    });
  }


  closeTutorial() {
    profileAPI.closeTutorial()
      .then(resp => {
        if(resp.error){
          console.log("Error occurred when closing the tutorial page. Internet connection may be down!");
        }
        profileStore.dispatch({type: "Close Tutorial", data: this.state.profile});
      })
  }

  goToProfile() {
    console.log("Go to profile.");
    this.props.history.push('/profile');
  }

  render() {
    return (
      <Suspense fallback={<Loading/>}>
        {(!this.state.loaded) && <Loading/>}
        <div id="main" className="container is-fluid">
          <nav
            className="navbar is-transparent"
            role="navigation"
            aria-label="main navigation"
          >
            <div className="navbar-brand">
              <a className="navbar-item is-size-4" href="https://tutopoint.com" data-step="1" data-intro="Welcome to TutoPoint! Please follow this simple walk through to learn about our service.">
                <span className="icon is-large">
                  <img src={tutologo} />
                </span>
                TUTOPOINT
              </a>

              <a
                onClick={this.toggleSideBarMobile}
                role="button"
                className="navbar-burger burger is-hidden-tablet"
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
                <div id="profilePicture" className="navbar-brand" data-step="6" data-intro="You can see your transaction history in your acount page, and your referral code and status. Thank you for choosing TutoPoint!">
                  <figure onClick={this.goToProfile} className="image is-48x48">
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
              className={`column is-2 ${
                (this.state.hidden || !this.state.profile?.tutorialHidden) ? "scale-up-ver-top" : "is-hidden-mobile"
              }`}
            >
              <aside className="menu">
                <ul className="menu-list">
                  <li>
                    <NavLink activeClassName="is-active" to="/dashboard">
                      Dashboard
                    </NavLink>
                  </li>
                  {this.state.profile?.__t == "guides" && (
                    <li>
                      <a href="/schedule">Schedule</a>
                    </li>
                  )}
                  <li>
                    <NavLink activeClassName="is-active" to="/appointments" data-step="5" data-intro="Your booked appointments will show up in appointments.">
                      Appointments
                    </NavLink>
                  </li>
                  <li>
                    <NavLink activeClassName="is-active" to="/documents" data-step="4" data-intro="Before your session, you can write up a questionnaire to send to your guide so they can prepare.">
                      Documents
                    </NavLink>
                  </li>
                  <li>
                    {this.state.profile?.__t == "clients" && (
                      <NavLink activeClassName="is-active" to="/discover" data-intro="First, you can find the entire list of our guides in the Discover page." data-step="2">
                        Discover
                      </NavLink>
                    )}
                  </li>
                  {this.state.profile?.__t == "guides" && (
                    <li>
                      <a>Balance - ${this.state.profile?.balance}</a>
                    </li>
                  )}
                  {this.state.profile?.__t == "clients" && (
                    <li>
                      <NavLink activeClassName="is-active" to="/balance" data-step="3" data-intro="Refill your balance to at least $15 before you book a session by clicking balance.">
                        Balance{" "}
                        {this.state.profile
                          ? `- $${(this.state.profile.stripe.balance / 100) *
                              -1}`
                          : ""}
                      </NavLink>
                    </li>
                  )}
                  {this.state.profile?.__t == "guides" &&
                    !this.state.profile?.onboarded && (
                      <li>
                        <a href="/onboard">Onboard</a>
                      </li>
                    )}
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
                  <Appointments />
                </Route>
                <Route path="/Profile">
                  <Profile/>
                </Route>
                <Route exact path="/Documents">
                  <Documents />
                </Route>
                <Route path="/Documents/:id">
                  <DocumentEdit />
                </Route>
                {this.state.profile?.__t == "clients" && (
                    <Route path="/Discover">
                    <Discover />
                  </Route>

                )}
                {this.state.profile?.__t == "clients" && (
                  <Route path="/Balance">
                    <Balance />
                  </Route>
                )}
                <Route path="/Logout">
                  <Logout />
                </Route>
                <Route path="/success">
                  <PaymentSuccess />
                </Route>
                {/* <Route path="/session/:id">
                  <Session />
                </Route> */}
              </Switch>
            </div>
          </div>
        </div>
      </Suspense>
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

const PaymentSuccess = () => {
  const profile = profileStore.getState();

  return (
    <div id="paymentSuccess" style={{ marginTop: "15vh" }}>
      <img
        style={{ marginLeft: "auto", marginRight: "auto", display: "block" }}
        className="image"
        width="171"
        height="161"
        src={checkmark}
      />

      <h1 className="has-font-weight-bold is-size-1 has-text-centered">
        Your payment has been processed
      </h1>
      <p className="has-font-weight-light is-size-5 has-text-centered">
        Your new balance is{" "}
        {profile ? `$${(profile.stripe.balance / 100) * -1}` : ""}
      </p>
      <p className="has-font-weight-light is-size-5 has-text-centered">
        A confirmation email has been sent to your inbox.
      </p>
      <Link
        className="button has-text-centered is-primary"
        style={{ marginLeft: "auto", marginRight: "auto" }}
        to="/dashboard"
      >
        Back to Dashboard
      </Link>
    </div>
  );
};

export default withRouter(App);
