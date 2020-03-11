import React from "react";
import ReactDOM from "react-dom";
import "./dashboard.scss";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  NavLink,
  Link,
  Redirect
} from "react-router-dom";

import discoverAPI from '../api/discover.js';

const DiscoverGuideItem = ({ major, name, university, grade, profilePic, backdrop }) => {
  return (
    <div className="card dashboard__discoverGuide_Item">
      <div className="card-image">
        <figure className="image is-3by1">
          <img
            src={backdrop ? backdrop : "https://bulma.io/images/placeholders/720x240.png"}
            alt="Placeholder image"
          />
        </figure>
      </div>
      <div className="card-content">
        <div className="media">
          <div className="media-left">
            <figure className="image is-96x96">
              <img
                className="is-rounded"
                src={profilePic ? profilePic : "https://bulma.io/images/placeholders/96x96.png"}
                alt="Placeholder image"
              />
            </figure>
          </div>
          <div className="media-content">
            <p className="is-size-6 has-text-weight-bold">
              {name} at <span className="highlight">{university}</span>
            </p>
            <p className="is-size-6 has-text-weight-bold">
              {grade} at <span className="highlight">{major}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {topGuides: null}
  }

  componentDidMount(){
      discoverAPI
        .getGuides()
        .then((guides) => {
            this.setState({topGuides: guides})
        })
  }

  render() {

    const guides = this.state.topGuides?.slice(0, 4).map((guide, i) => {
        return <DiscoverGuideItem key={i} major={guide.major} name={guide.name} university={guide.university} grade={guide.grade} profilePic={guide.profilePic} backdrop={guide.backdrop}></DiscoverGuideItem>
    })

    return (
      <React.Fragment>
        <div id="dashboard__discoverGuide" className="card">
          <header className="card-header">
            <p className="is-size-3 card-header-title">Discover Guides</p>
            <p className="card-header-icon has-text-black">
              <Link to="/discover" className="highlight">
                See all
              </Link>
            </p>
          </header>
          <div className="card-content dashboard__discoverGuideCarousel">
            {guides}
          </div>
        </div>
        <Router>
        <Redirect to="/dashboard/upcoming"/> 
          <div id="dashboard__bottomPreview" className="columns">
            <div className="column is-half">
              <div id="dashboard__previewAppointments" className="card">
                <header className="card-header">
                  <p className="is-size-3 card-header-title">
                    Your Appointments
                  </p>

                  <p className="card-header-icon has-text-black">
                    <NavLink activeClassName="highlight" to="/dashboard/upcoming">Upcoming</NavLink>
                  </p>
                  <p className="card-header-icon has-text-black">
                    <NavLink activeClassName="highlight" to="/dashboard/past">Past</NavLink>
                  </p>
                </header>
                <div className="card-content">
                  <Switch>
                    <Route path="/dashboard/upcoming">
                      <h1>Upcoming</h1>
                    </Route>
                    <Route path="/dashboard/past">
                      <h3>Past</h3>
                    </Route>
                  </Switch>
                </div>
              </div>
            </div>
            <div className="column is-half">
              <div id="dashboard__previewAppointments" className="card">
                <header className="card-header">
                  <p className="is-size-3 card-header-title">Your Documents</p>
                </header>
              </div>
            </div>
          </div>
        </Router>
      </React.Fragment>
    );
  }
}
export default Dashboard;
