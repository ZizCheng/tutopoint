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

import Appointments from './appointments.jsx'
import DiscoverGuideItem from './DiscoverGuideItem.jsx';


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
        <div id="dashboard__discoverGuide" className="card is-hidden-touch">
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
              <Appointments/>
            </div>
            <div className="column is-half">
              <div id="dashboard__previewAppointments" className="card">
                <header className="card-header">
                  <p className="is-size-3 card-header-title is-size-6-touch">Your Documents</p>
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
