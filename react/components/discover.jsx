import React from "react";
import ReactDOM from "react-dom";

import DiscoverGuideItem from "./DiscoverGuideItem.jsx";

import { withRouter } from "react-router-dom";

import "./discover.scss";
import discoverAPI from "../api/discover.js";
import profileAPI from "../api/profile.js";
import sessionAPI from "../api/session.js";

import profileStore from "../store/profileStore.js";

import moment from "moment-timezone";

class ScheduleWithoutRouter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { schedule: null };
    this.select = this.select.bind(this);
  }

  componentDidMount() {
    discoverAPI.getGuideSchedule(this.props.id).then(data => {
      let newIntervals = data?.schedule.slice();
      for (const interval of newIntervals) {
        console.log(typeof interval[2] != "undefined");
        interval.push({selected: false});
      }
      newIntervals = newIntervals.filter(interval => {
        console.log(interval[2]);
        return moment() < moment(interval[0]) && typeof interval[2] != "undefined";
      });
      this.setState({ schedule: newIntervals });
    });
  }

  select(intervalIndex) {
    if (this.state.schedule[intervalIndex].selected == true) {
      const guideID = this.props.id;
      sessionAPI
        .requestSession(guideID, this.state.schedule[intervalIndex][0])
        .then(response => {
          if (response.message == "ok") {
            profileAPI.getProfile().then(profile => {
              profileStore.dispatch({ type: "Update", data: profile });
              this.props.history.push("/dashboard");
            });
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
    if (interval[2] == "booked") {
      return "booked";
    }
    else if (interval[2] == "available") {
      return interval.selected ? "Confirm" : "Selected";
    }
  }

  render() {
    const schedules = this.state.schedule?.map((interval, row) => {
      const format = "ddd MM/DD HH:mm";
      const timezones = [
        moment.tz.guess(),
        "America/Los_Angeles",
        "America/New_York",
        "Asia/Shanghai"
      ].map((timezone, column) => {
        return (
          <td className="monospace" key={row + "" + column}>
            {moment(interval[0])
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
            onClick={this.select.bind(this, row)}
          >
            {this.renderButtonText(this.state.schedule[row])}
          </button>
        </td>
      );
      return <tr>{timezones}</tr>;
    });
    return (
      <div className="table-container">
        <table className="table is-fullwidth">
          <thead>
            <tr>
              <th className="has-text-grey">Detected Time</th>
              <th className="has-text-grey">Los Angeles Time</th>
              <th className="has-text-grey">New York Time</th>
              <th className="has-text-grey">Beijing Time</th>
              <th className="has-text-grey">Availability</th>
            </tr>
          </thead>
          <tbody>{schedules}</tbody>
        </table>
      </div>
    );
  }
}

const Schedule = withRouter(ScheduleWithoutRouter);

class Discover extends React.Component {
  constructor(props) {
    super(props);
    this.state = { topGuides: null };

    this.handleGuideClicked = this.handleGuideClicked.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  componentDidMount() {
    discoverAPI.getGuides().then(guides => {
      this.setState({ topGuides: guides });
    });
  }

  handleGuideClicked(i) {
    const currentGuide = this.state.topGuides[i];

    this.setState({ focus: true, focusedGuide: currentGuide });
  }

  closeModal() {
    this.setState({ focus: false });
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
        <div id="appointments" className="card">
          <header className="card-header">
            <p className="is-size-3 card-header-title is-size-6-touch">
              Discover
            </p>
          </header>
          <div className="discover__guideWrapper card-content is-block-mobile">
            {guides}
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default Discover;
