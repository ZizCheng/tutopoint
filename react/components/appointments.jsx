import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./appointments.scss";

import profileStore from "../store/profileStore.js";

const calculateTimeLeft = date => {
  const difference = new Date(date) - Date.now();
  let timeLeft = {};

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  }

  return timeLeft;
};

const AppointmentItem = ({
  title,
  date,
  guideName,
  guideGrade,
  guideMajor,
  guideUniversity,
  guideProfilePic,
  status
}) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(date));
  let timerComponents = [];
  if (status == "active") {
    console.log(status);
    useEffect(() => {
      const timer = setTimeout(() => {
        setTimeLeft(calculateTimeLeft(date))
      }, 1000);

      return () => clearTimeout(timer);
    });

    Object.keys(timeLeft).forEach(interval => {
      if (!timeLeft[interval]) {
        return;
      }

      timerComponents.push(
        <span>
          {timeLeft[interval]} {interval}{" "}
        </span>
      );
    });

    console.log(timerComponents);
  } else {
    timerComponents = [];
  }

  return (
    <article className={`media ${status}`}>
      <figure className="media-left">
        <p className="image is-128x128">
          <img
            className="is-rounded"
            src={
              guideProfilePic
                ? guideProfilePic
                : "https://bulma.io/images/placeholders/128x128.png"
            }
          />
        </p>
      </figure>
      <div className="media-content">
        <div className="content">
          <p className="is-size-4 has-text-weight-bold">{title}</p>
          <p className="is-size-4 has-text-weight-light">
            {guideGrade} at {guideUniversity}
          </p>
          <p className="is-size-4 has-text-weight-light">{guideMajor}</p>
        </div>
        <nav className="level is-mobile">
          <div className="level-left">
            <a className="level-item">
              <span className="icon is-small">
                <i className="fas fa-reply"></i>
              </span>
            </a>
            <a className="level-item">
              <span className="icon is-small">
                <i className="fas fa-retweet"></i>
              </span>
            </a>
            <a className="level-item">
              <span className="icon is-small">
                <i className="fas fa-heart"></i>
              </span>
            </a>
          </div>
        </nav>
      </div>
      <div className="media-right">
        {timerComponents.length ? (
          <p className="is-size-6 has-text-right">{timerComponents}</p>
        ) : null}

        <p className="is-size-6 has-text-right is-capitalized">{status}</p>

        {status == "active" ? (
          <div className="control is-expanded">
            <button className={"button is-light is-fullwidth"} disabled={Date.now()+300000 > new Date(date).valueOf() ? '' : 'disabled'}>Join</button>
          </div>
        ) : (
          ""
        )}
      </div>
    </article>
  );
};

class Appointments extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isUpcoming: true, profile: profileStore.getState() };

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(bool) {
    this.setState({ isUpcoming: bool });
  }

  componentDidMount() {
    profileStore.subscribe(() => {
      this.setState({ profile: profileStore.getState() });
    });
  }

  render() {
    const pastSession = this.state.profile?.sessions
      .filter(session => {
        const sessionDate = new Date(session.date);
        return Date.now() - 300000 >= sessionDate.valueOf();
      })
      .map((session, i) => {
        return (
          <AppointmentItem
            key={i}
            title={session.title}
            date={session.date}
            guideName={session.createdBy.name}
            guideGrade={session.createdBy.guide}
            guideMajor={session.createdBy.major}
            guideUniversity={session.createdBy.university}
            guideProfilePic={session.createdBy.profilePic}
            status="inactive"
          />
        );
      });

    const activeSession = this.state.profile?.sessions
      .filter(session => {
        const sessionDate = new Date(session.date);
        return Date.now() - 300000 < sessionDate.valueOf();
      })
      .map((session, i) => {
        return (
          <AppointmentItem
            key={i}
            title={session.title}
            date={session.date}
            guideName={session.createdBy.name}
            guideGrade={session.createdBy.guide}
            guideMajor={session.createdBy.major}
            guideUniversity={session.createdBy.university}
            guideProfilePic={session.createdBy.profilePic}
            status="active"
          />
        );
      });

    return (
      <div id="appointments" className="card">
        <header className="card-header">
          <p className="is-size-3 card-header-title is-size-6-touch">
            Your Appointments
          </p>

          <p className="card-header-icon has-text-black">
            <a
              onClick={() => {
                this.handleClick(true);
              }}
              className={this.state.isUpcoming ? "highlight" : ""}
            >
              Upcoming
            </a>
          </p>
          <p className="card-header-icon has-text-black">
            <a
              onClick={() => {
                this.handleClick(false);
              }}
              className={!this.state.isUpcoming ? "highlight" : ""}
            >
              Past
            </a>
          </p>
        </header>
        <div className="card-content">
          <div className={!this.state.isUpcoming ? "is-hidden" : ''}>
              {activeSession}
          </div>
          <div className={this.state.isUpcoming ? "is-hidden" : ''}>
              {pastSession}
          </div>
        </div>
      </div>
    );
  }
}

export default Appointments;
