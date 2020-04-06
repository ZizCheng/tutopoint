import React from "react";
import ReactDOM from "react-dom";
import "./dashboard.scss";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  NavLink,
  Link,
  Redirect,
  withRouter,
} from "react-router-dom";

import discoverAPI from '../api/discover.js';
import profileStore from "../store/profileStore.js";

import Appointments from './appointments.jsx'
import DiscoverGuideItem from './DiscoverGuideItem.jsx';
import DocumentCompactList from './DocumentCompactList.jsx';


class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {topGuides: null, profile: profileStore.getState()};
  }

  componentDidMount(){
      discoverAPI
        .getGuides(1)
        .then((guides) => {
            this.setState({topGuides: guides.data})
        })

        this.unsubscribe = profileStore.subscribe(() => {
          this.setState({ profile: profileStore.getState() });
        });
  }

  componentWillUnmount() {
    this.unsubscribe()
}

  render() {
    const guides = this.state.topGuides?.slice(0, 4).map((guide, i) => {
        return <DiscoverGuideItem key={i} major={guide.major} name={guide.name} university={guide.university} grade={guide.grade} profilePic={guide.profilePic} backdrop={guide.backdrop}
        onClick={() => {
          this.props.history.push(`/discover/?guide=${guide._id}`);
        }}></DiscoverGuideItem>
    })

    return (
      <React.Fragment>
        <div id="dashboard__discoverGuide" className={`card is-hidden-touch ${this.state.profile?.__t == "guides" ? 'is-hidden' : ""}`}>
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
              <Appointments existingHistory={this.props.history}/>
            </div>
            <div className="column is-half">
              <div id="dashboard__previewAppointments" className="card">
                <header className="card-header">
                  <p className="is-size-3 card-header-title is-size-6-touch">Your Documents</p>
                </header>
                <DocumentCompactList
                  action={function(doc_id) {
                    window.location.href = "/documents/" + doc_id;
                  }}
                />
              </div>
            </div>
          </div>
        </Router>
      </React.Fragment>
    );
  }
}
export default withRouter(Dashboard);
