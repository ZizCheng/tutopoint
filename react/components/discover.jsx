import React from "react";
import ReactDOM from "react-dom";

import DiscoverGuideItem from "./DiscoverGuideItem.jsx";

import { withRouter } from "react-router-dom";

import "./discover.scss";
import discoverAPI from "../api/discover.js";
import profileAPI from "../api/profile.js";
import sessionAPI from "../api/session.js";
import scheduleAPI from "../api/schedule.js";

import profileStore from "../store/profileStore.js";

import moment from "moment-timezone";

class ScheduleWithoutRouter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { schedule: null };
    this.select = this.select.bind(this);
  }

  componentDidMount() {
    discoverAPI.getGuideSchedule(this.props.id).then((data) => {
      let newIntervals = data?.slice();
      for (const interval of newIntervals) {
        interval.selected = false;
      }
      newIntervals = newIntervals.filter(interval => {
        return moment() < moment(interval.start) && typeof interval.status != "undefined";
      });
      this.setState({ schedule: newIntervals });
    });
  }

  select(intervalIndex) {
    if (this.state.schedule[intervalIndex].selected == true) {
      const guideID = this.props.id;
      sessionAPI
        .requestSession(guideID, this.state.schedule[intervalIndex].start)
        .then(response => {
          if (response.message == "ok") {
            profileAPI.getProfile().then(profile => {
              profileStore.dispatch({ type: "Update", data: profile });
              this.props.history.push("/dashboard");
            });
          }else if(response.error && response.code == 15){
            this.props.history.push('/balance?balanceerror=true')
          }
        });
        
    } else {
      let newSchedule = this.state.schedule.slice();
      for (let i = 0; i < this.state.schedule.length; i++) {
        newSchedule[i].selected = false;
      }
      newSchedule[intervalIndex].selected = true;
      this.setState({
        schedule: newSchedule
      });
    }
  }

  renderButtonText(interval) {
    console.log(interval);
    if (interval.status == "booked") {
      return "booked";
    }
    else if (interval.status == "available") {
      return interval.selected ? "Confirm" : "Select";
    }
  }

  render() {
    var intervalTableHtml = 'Loading';
    if(this.state.schedule !== null)
    {
      scheduleAPI.stringToDate(this.state.schedule);
      intervalTableHtml = scheduleAPI.listTimes(this.state.schedule).map((time, row) => {
        const format = "ddd MM/DD HH:mm";
        const timezones = [
          moment.tz.guess(),
          "America/Los_Angeles",
          "America/New_York",
          "Asia/Shanghai"
        ].map((timezone, column) => {
          if (column == 0) {
            return (
              <td className="monospace" key={row + "" + column}>
                {moment(time).tz(timezone).format(format)}
              </td>
            )
          }
          return (
            <td className="monospace is-hidden-mobile" key={row + "" + column}>
              {moment(time)
                .tz(timezone)
                .format(format)}
            </td>
          );
        });
        timezones.push(
          <td key={row + "" + 4}>
            <button
              className={
                "button" +
                (this.state.schedule[row].selected ? " is-primary" : "")
              }
              disabled={(this.state.schedule[row].status == 'booked')}
              onClick={this.select.bind(this, row)}
            >
              {this.renderButtonText(this.state.schedule[row])}
            </button>
          </td>
        );
        return <tr>{timezones}</tr>;
      });
    }
    return (
      <div className="table-container">
        <table className="table is-fullwidth">
          <thead>
            <tr>
              <th className="has-text-grey">Detected Time</th>
              <th className="has-text-grey is-hidden-mobile">Los Angeles Time</th>
              <th className="has-text-grey is-hidden-mobile">New York Time</th>
              <th className="has-text-grey is-hidden-mobile">Beijing Time</th>
              <th className="has-text-grey">Availability</th>
            </tr>
          </thead>
          <tbody>{intervalTableHtml}</tbody>
        </table>
      </div>
    );
  }
}

const Schedule = withRouter(ScheduleWithoutRouter);

class Discover extends React.Component {
  constructor(props) {
    super(props);
    this.state = { topGuides: null, currentPage: 1 };

    this.handleGuideClicked = this.handleGuideClicked.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.previousPage = this.previousPage.bind(this);
    this.nextPage = this.nextPage.bind(this);
  }

  componentDidMount() {
    discoverAPI.getGuides(this.state.currentPage).then(guides => {
      this.setState({ topGuides: guides.data, totalGuides: guides.count });
    });
  }

  handleGuideClicked(i) {
    const currentGuide = this.state.topGuides[i];

    this.setState({ focus: true, focusedGuide: currentGuide });
  }

  closeModal() {
    this.setState({ focus: false });
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if(prevState.currentPage != this.state.currentPage){
      discoverAPI.getGuides(this.state.currentPage).then(guides => {
        this.setState({ topGuides: guides.data, totalGuides: guides.count });
      });
    }
  }

  previousPage() {
    if(this.state.currentPage == 1) return;
    this.setState({currentPage: this.state.currentPage - 1})
  }

  nextPage() {
    if(this.state.currentPage == Math.ceil(this.state.totalGuides / 12)) return;
    this.setState({currentPage: this.state.currentPage + 1})
  }

  render() {
    const guides = this.state.topGuides?.map((guide, i) => {
      return (
        <DiscoverGuideItem
          key={i}
          major={guide.major}
          name={guide.name}
          university={guide.university}
          grade={guide.grade}
          profilePic={guide.profilePic}
          backdrop={guide.backdrop}
          onClick={() => {
            this.handleGuideClicked(i);
          }}
        ></DiscoverGuideItem>
      );
    });

    return (
      <React.Fragment>
        {this.state.focus && (
          <div className="modal is-active">
            <div className="modal-background"></div>
            <div className="modal-content">
              <div id="discover__focusedGuide" className="card">
                <div className="columns profile-modal">
                  <div className="column is-one-quarter">
                    <div className="profile-image">
                      <figure className="image is-1by1">
                        <img
                          src={
                            typeof this.state.focusedGuide?.profilePic !==
                            "undefined"
                              ? this.state.focusedGuide.profilePic
                              : "https://bulma.io/images/placeholders/96x96.png"
                          }
                          alt="Placeholder image"
                        />
                      </figure>
                      <figure className="image is-1by1 logo-image">
                        <img
                          src={
                            typeof this.state.focusedGuide?.logo !== "undefined"
                              ? this.state.focusedGuide.logo
                              : "https://bulma.io/images/placeholders/96x96.png"
                          }
                          alt="Placeholder image"
                        />
                      </figure>
                    </div>
                  </div>
                  <div className="column">
                    <h1 className="is-size-3 has-text-weight-bold">
                      {this.state.focusedGuide.name}
                    </h1>
                    <h2 className="is-size-4 highlight">
                      {this.state.focusedGuide.university},{" "}
                      {this.state.focusedGuide.grade} in{" "}
                      {this.state.focusedGuide.major}
                    </h2>

                    {/* <p className="is-size-6">Rating</p> */}
                    <p className="is-size-6 has-text-weight-bold bio-text">
                      {this.state.focusedGuide.bio}
                    </p>
                    <div className="tabs">
                      <ul>
                        <li className="is-active">
                          <a>Schedule</a>
                        </li>
                        <li>
                          <a>Reviews</a>
                        </li>
                      </ul>
                    </div>

                    {/* schedule */}
                    <Schedule id={this.state.focusedGuide._id} />
                  </div>
                </div>
              </div>
            </div>
            <button
              className="modal-close is-large"
              aria-label="close"
              onClick={this.closeModal}
            ></button>
          </div>
        )}
        <div id="discover" className="card">
          <header className="card-header">
            <p className="is-size-3 card-header-title is-size-6-touch">
              Discover
            </p>
            {/* <div className="card-header-icon has-text-white">
              <p className="button has-text-white is-primary">Filter</p>
            </div> */}
          </header>
          <div className="discover__guideWrapper card-content is-block-mobile">
            {guides}
          </div>
          {(this.state.totalGuides  / 12 > 1) && <footer className="card-footer">
          <nav className="card-footer-item is-centered" role="navigation" aria-label="pagination">
            <a onClick={this.previousPage} className="pagination-previous">Previous</a>
            <a onClick={this.nextPage} className="pagination-next">Next page</a>
          </nav>
  </footer>}
        </div>
      </React.Fragment>
    );
  }
}

export default withRouter(Discover);
