import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./appointments.scss";
import sessionAPI from "../api/session.js";
import documentAPI from "../api/session.js";
import profileAPI from "../api/profile.js";
import profileStore from "../store/profileStore.js";

import DocumentCompactList from "./DocumentCompactList.jsx";

import { withRouter } from "react-router-dom";

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
  onClick,
  sessionid,
  confirm,
  cancel,
  send,
  status
}) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(date));
  let timerComponents = [];
  if (status == "active") {
    useEffect(() => {
      const timer = setTimeout(() => {
        setTimeLeft(calculateTimeLeft(date));
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
  } else {
    timerComponents = [];
  }

  return (
    <article className={`media ${status}`}>
      <figure className="media-left">
        <p className="image is-128x128 is-hidden-touch">
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
          <p className="is-size-6-mobile is-size-4 has-text-weight-bold">
            {title}
          </p>
          <p className="is-size-7-mobile is-size-4 has-text-weight-light">
            {guideGrade} at {guideUniversity}
          </p>
          <p className="is-size-7-mobile is-size-5 has-text-weight-light">
            {guideMajor}
          </p>
        </div>
      </div>
      <div className="media-right">
        {timerComponents.length ? (
          <p className="is-size-6 has-text-right">{timerComponents}</p>
        ) : null}

        <p className="is-size-6 has-text-right is-capitalized">{status}</p>

        {status == "active" ? (
          <div className="control is-expanded">
            <button
              className={"button is-light is-fullwidth"}
              onClick={() => {
                onClick(sessionid);
              }}
              disabled={
                Date.now() + 300000 > new Date(date).valueOf() ? "" : "disabled"
              }
            >
              Join
            </button>
            <button
              className={"button is-light is-fullwidth"}
              onClick={() => {
                cancel(sessionid);
              }}
              disabled={
                profileStore.getState().__t == "clients" ? "" : "disabled"
              }
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className={"button is-light is-fullwidth"}
            onClick={() => {
              cancel(sessionid);
            }}
            disabled={
              profileStore.getState().__t == "clients" ? "" : "disabled"
            }
          >
            Cancel
          </button>
        )}
        <button className={"button is-light is-fullwidth"} onClick={() => {
            send(sessionid);
          }}
          disabled={
            profileStore.getState().__t == "clients" ? "" : "disabled"
          }
        >
          Send Quistionnare
        </button>
        {profileStore.getState().__t == "guides" && status == "unconfirmed" && (
          <button
            className={"button is-light is-fullwidth"}
            onClick={() => {
              confirm(sessionid);
            }}
          >
            Confirm
          </button>
        )}
        {status == "" && (
          <button className={"button is-light"}>Rebook</button>
        )}
      </div>
    </article>
  );
};

class Appointments extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isUpcoming: true,
      profile: profileStore.getState(),
      documentCompactListPopup: '',
    };

    this.handleClick = this.handleClick.bind(this);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.sendDocument = this.sendDocument.bind(this);
  }

  handleClick(bool) {
    this.setState({ isUpcoming: bool });
  }

  componentDidMount() {
    this.unsubscribe = profileStore.subscribe(() => {
      this.setState({ profile: profileStore.getState() });
    });
  }

  componentWillUnmount() {
    this.unsubscribe()
}

  sessionClicked(i) {
    window.location.href = `/session/${i}`;
  }

  handleConfirm(sessionid) {
    sessionAPI.confirm(sessionid).then(resp => {
      if (resp?.message == "ok") {
        // Needs fixing. Timer does not want to end causing hook crash.
        // window.location.href = "/dashboard";
        profileAPI.getProfile()
        .then(() => this.props.history.push('/dashboard'));
      }
    });
  }

  handleCancel(sessionid) {
    sessionAPI.cancel(sessionid).then(resp => {
      if (resp?.message == "ok") {
        // Needs fixing. Timer does not want to end causing hook crash.
        // window.location.href = "/dashboard";
        profileAPI.getProfile()
        .then(() => this.props.history.push('/dashboard'));
      }
    });
  }

  sendDocument(sessionid){
    this.setState({
      documentCompactListPopup: "<DocumentCompactList />"
    });
  }

  render() {
    if (this.props.pastOnly) {
      let pastSession = this.state.profile?.sessions.filter(session => {
        const sessionDate = new Date(session.date);
        return (
          Date.now() - 300000 >= sessionDate.valueOf() || session.completed
        );
      });
      pastSession = !pastSession ? [] : pastSession;
      let result = [];
      const map = new Map();
      for (const item of pastSession) {
        if (!map.has(item.createdBy._id)) {
          map.set(item.createdBy._id, true); // set any value to Map
          result.push(item);
        }
      }

      result = result.map((session, i) => {
        return (
          <AppointmentItem
            key={i}
            title={session.createdBy.name}
            date={session.date}
            guideName={session.createdBy.name}
            guideGrade={session.createdBy.grade}
            guideMajor={session.createdBy.major}
            guideUniversity={session.createdBy.university}
            guideProfilePic={session.createdBy.profilePic}
            status=""
          />
        );
      });

      return (
        <div>
          <header className="card-header">
            <p className="is-size-3">Past guides</p>
          </header>
          <div style={{marginTop: '0.5em'}}>{result}</div>
        </div>
      );
    }

    let pastSession = this.state.profile?.sessions
      .filter(session => {
        const sessionDate = new Date(session.date);
        return (
          Date.now() - 300000 >= sessionDate.valueOf() || session.completed
        );
      })
      .map((session, i) => {
        return (
          <AppointmentItem
            key={i}
            title={session.title}
            date={session.date}
            guideName={session.createdBy.name}
            guideGrade={session.createdBy.grade}
            guideMajor={session.createdBy.major}
            guideUniversity={session.createdBy.university}
            guideProfilePic={session.createdBy.profilePic}
            status="past"
          />
        );
      });

    const activeSession = this.state.profile?.sessions
      .filter(session => {
        const sessionDate = new Date(session.date);
        return (
          Date.now() - 300000 < sessionDate.valueOf() && !session.cancelled
        );
      })
      .map((session, i) => {
        const sessionDate = new Date(session.date);
        let sessionStatus;

        if (session.confirmed) {
          sessionStatus = "confirmed";
          if (sessionDate > Date.now() - 300000) {
            sessionStatus = "active";
          }
        } else {
          sessionStatus = "unconfirmed";
        }
        return (
          <AppointmentItem
            key={i}
            title={session.title}
            date={session.date}
            guideName={session.createdBy.name}
            guideGrade={session.createdBy.grade}
            guideMajor={session.createdBy.major}
            guideUniversity={session.createdBy.university}
            guideProfilePic={session.createdBy.profilePic}
            onClick={this.sessionClicked}
            sessionid={session._id}
            confirm={this.handleConfirm}
            cancel={this.handleCancel}
            send={this.sendDocument}
            status={sessionStatus}
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
          <div className={!this.state.isUpcoming ? "is-hidden" : ""}>
            {activeSession}
          </div>
          <div className={this.state.isUpcoming ? "is-hidden" : ""}>
            {pastSession}
          </div>
        </div>
        {this.state.documentCompactListPopup}
      </div>
    );
  }
}

export default withRouter(Appointments);
