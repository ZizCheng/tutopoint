import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { NavLink } from 'react-router-dom';


import "./appointments.scss";
import sessionAPI from "../api/session.js";
import documentAPI from "../api/document.js";
import profileAPI from "../api/profile.js";
import profileStore from "../store/profileStore.js";
import createModal from "./createModal.jsx";


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
  clientName,
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
  updateParentSessionId,
  status,
  free,
}) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(date));
  let timerComponents = [];
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft(date));
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  Object.keys(timeLeft).forEach((interval, index) => {
    if (!timeLeft[interval]) {
      return;
    }

    timerComponents.push(
      <span key={index}>
        {timeLeft[interval]} {interval}{" "}
      </span>
    );
  });

  const dateFormatter = new Intl.DateTimeFormat('en-us', { month: "2-digit" , year: "2-digit", day: "2-digit", hour: 'numeric' });
  const formattedDate = dateFormatter.format(new Date(date));

  return (
    <article className={`media ${status}`}>
      <div className="media-left">
        <figure className="image is-64x64 is-hidden-touch">
          <img className="is-rounded"
            src={guideProfilePic ? guideProfilePic : "https://bulma.io/images/placeholders/64x64.png"} />
        </figure>
      </div>
      <div className="media-content">
        <div className="content">
          {(profileStore.getState().__t == "guides") && (
            <p className="is-size-6-widescreen is-size-6 has-text-weight-bold">Session with {clientName}</p>
          )}
          {(profileStore.getState().__t == "clients") && (
            <div className="react-stupid-gremlin-rules">
              <p className="is-size-6-widescreen is-size-6 has-text-weight-bold">{title}</p>
              <p className="is-size-7-widescreen is-size-6 has-text-weight-light">{guideGrade} at {guideUniversity}</p>
              <p className="is-size-7-widescreen is-size-7 has-text-weight-light">{guideMajor}</p>
            </div>
          )}
          {free && (<p className="is-size-7-widescreen has-text-success">This is a free session.</p>)}
        </div>
      </div>
      <div className="media-right">
        <p className="is-size-6 has-text-right">{formattedDate}</p>
        <p className="is-size-6 has-text-right is-capitalized">{status}</p>

        {status == "active" ? (
          <div className="control is-expanded">
            <button className={"button is-light is-fullwidth is-small"}
              onClick={() => {
                onClick(sessionid);
              }}
              disabled={
                Date.now() + 300000 > new Date(date).valueOf() ? "" : "disabled"
              }
            >
              Join
            </button>
          </div>
        ) : null}
        {(profileStore.getState().__t == "clients" && status != "past") && (
          <div className="control is-expanded">
            <button
              className={"button is-light is-fullwidth is-small"}
              onClick={() => {
                createModal("Are you sure you want to cancel the session with "+guideName+" on "+formattedDate+"? This action is irreversible.", () => {cancel(sessionid)});
              }}
              disabled={
                profileStore.getState().__t == "clients" ? "" : "disabled"
              }
            >
              Cancel
            </button>
            <button
              className={"button is-light is-fullwidth is-small"}
              onClick={() => {
                updateParentSessionId(sessionid);
                send(sessionid);
              }}
              disabled={
                profileStore.getState().__t == "clients" ? "" : "disabled"
              }
            >
              Send questionnaire
            </button>
          </div>
        )}

        {profileStore.getState().__t == "guides" && status == "unconfirmed" && (
          <button
            className={"button is-light is-fullwidth"}
            onClick={() => {
              createModal("Are you sure you want to confirm this session? This action is irreversible.", () => {confirm(sessionid)});
            }}
          >
            Confirm
          </button>
        )}
        {status == "" && <button className={"button is-light"}>Rebook</button>}
      </div>
    </article>
  );
};

class Appointments extends React.Component {
  constructor(props) {
    super(props);
    //this.state.profile is used to get sessions later
    this.state = {
      isUpcoming: true,
      profile: profileStore.getState(),
      selectDocumentPopup: "",
      selectedSessionId: null
    };

    this.handleClick = this.handleClick.bind(this);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.updateSessionId = this.updateSessionId.bind(this);
    this.action = this.action.bind(this);
    this.sendDocument = this.sendDocument.bind(this);
  }

  handleClick(bool) {
    this.setState({ isUpcoming: bool });
  }

  componentDidMount() {
    this.unsubscribe = profileStore.subscribe(() => {
      this.setState({ profile: profileStore.getState() });
    });

    function closeModal(e) {
      document
        .getElementById("select-document-popup")
        .classList.remove("is-active");
    }
    this.setState({
      selectDocumentPopup: (
        <div id="select-document-popup" className="modal">
          <div className="modal-background"></div>
          <div className="modal-content">
            <DocumentCompactList action={this.action} />
          </div>
          <button className="modal-close is-large" aria-label="close" onClick={closeModal}></button>
        </div>
      )
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  sessionClicked(i) {
    console.log(i);
    sessionAPI.info(i).then(resp => {
      console.log(resp.createdBy);
      window.location.href = resp.createdBy.zoomLink;
    })
  }

  handleConfirm(sessionid) {
    sessionAPI.confirm(sessionid).then(resp => {
      if (resp?.message == "ok") {
        // Needs fixing. Timer does not want to end causing hook crash.
        // window.location.href = "/dashboard";
        profileAPI.getProfile().then(data => {
          profileStore.dispatch({ type: "Update", data: data });
          this.props.history.push("/dashboard");
        });
      }
    });
  }

  handleCancel(sessionid) {
    sessionAPI.cancel(sessionid).then(resp => {
      if (resp?.message == "ok") {
        // Needs fixing. Timer does not want to end causing hook crash.
        // window.location.href = "/dashboard";
        profileAPI.getProfile().then(data => {
          profileStore.dispatch({ type: "Update", data: data });
          this.props.history.push("/dashboard");
        });
      }
    });
  }

  sendDocument(sessionid) {
    document.getElementById("select-document-popup").classList.add("is-active");
  }
  //document selection
  action(doc_id) {
    console.log(this.state.selectedSessionId);
    documentAPI.sendDocument(doc_id, this.state.selectedSessionId);
    document.getElementById("select-document-popup").classList.remove("is-active");
  }
  updateSessionId(sessionid) {
    this.setState(
      {
        selectedSessionId: sessionid
      },
      console.log("update state finsih", this.state)
    );
  }

  render() {
    console.log(this.state.profile?.sessions);
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
            clientName={session.clients[0] ? session.clients[0].name : "?"}
            guideName={session.createdBy.name}
            guideGrade={session.createdBy.grade}
            guideMajor={session.createdBy.major}
            guideUniversity={session.createdBy.university}
            guideProfilePic={session.createdBy.profilePic}
            status=""
            free={session.free}
          />
        );
      });

      return (
        <div>
          <header className="card-header">
            <p className="is-size-3">Past guides</p>
          </header>
          <div style={{ marginTop: "0.5em" }}>{result}</div>
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
        console.log(session);
        return (
          <AppointmentItem
            key={i}
            title={session.title}
            date={session.date}
            clientName={session.clients[0] ? session.clients[0].name : "?"}
            guideName={session.createdBy.name}
            guideGrade={session.createdBy.grade}
            guideMajor={session.createdBy.major}
            guideUniversity={session.createdBy.university}
            guideProfilePic={session.createdBy.profilePic}
            status="past"
            free={session.free}
          />
        );
      });

    var activeSession = this.state.profile?.sessions
      .filter(session => {
        const sessionDate = new Date(session.date);
        return (
           (Date.now() < sessionDate.valueOf()  || (Date.now() > sessionDate.valueOf() - 300000 && Date.now() < sessionDate.valueOf() + (2*60*60*1000))) && (!session.cancelled && !session.completed)
        );
      })
      .map((session, i) => {

        const sessionDate = new Date(session.date);
        let sessionStatus;

        if (session.confirmed) {
          sessionStatus = "confirmed";
          if (Date.now() > sessionDate.valueOf() - 300000 && Date.now() < sessionDate.valueOf() + (2*60*60*1000)) {
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
            clientName={session.clients[0] ? session.clients[0].name : "?"}
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
            updateParentSessionId={this.updateSessionId}
            status={sessionStatus}
            free={session.free}
          />
        );
      });
    if(!activeSession || activeSession.length === 0)
    {
        activeSession = (
          <div className="appointments-no-upcoming-wrapper">
            You have no upcoming appointments.<br></br>
          {(this.state.profile?.__t == "clients" && (<a className="appointments-book-now" onClick={() => {
            if(this.props.existingHistory){
              return this.props.existingHistory.push('/discover');
            }
            this.props.history.push('/discover');
          }}>Book one now.</a>))}
          </div>
        )
    }

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
        {this.state.selectDocumentPopup}
      </div>
    );
  }
}

export default withRouter(Appointments);
