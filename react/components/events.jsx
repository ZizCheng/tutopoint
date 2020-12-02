import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { NavLink } from 'react-router-dom';


import "./events.scss";
import event from "../api/events.js";
import store from "../store/store.js";
import EventItem from "./EventItem.jsx";

import { withRouter } from "react-router-dom";

class Events extends React.Component {
  constructor(props) {
    super(props);
    //this.state.profile is used to get sessions later
    this.state = {
      profile: store.getState().profileState,
      modalView: false
    };
    this.handleEventClicked = this.handleEventClicked.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.RSVP = this.RSVP.bind(this);


  }


  componentDidMount() {
    this.unsubscribe = store.subscribe(() => {
      this.setState({ profile: store.getState().profileState });
    });
    event.getEvents().then((a) => {
      console.log(a)
      this.setState({ events: a.events });
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  handleEventClicked(i) {
    const selectedEvent = this.state.events[i];
    this.setState({ modalView: true, selectedEvent: selectedEvent});
  }

  closeModal() {
    this.setState({ modalView: false});
  }

  RSVP() {
    console.log(this.state.profile?._id); //profile?._id is showing up as null?
    event.RSVP(this.state.selectedEvent._id, this.state.profile?._id)
      .then(response => {console.log(response)});
  }

  render() {

    let SignedupEvents = this.state.events?.filter(a => {
      return a.clients.includes(this.profile?._id);
    }).map((a, key) => { return <EventItem event={a} key={key} /> });

    let UpcomingEvents = this.state.events?.filter(a => {
      return !a.clients.includes(this.profile?._id);
    }).map((a, key) => { return <EventItem event={a} key={key} upcoming={true} 
      onClick={() => {
      this.handleEventClicked(key);
    }} /> });


    return (
      <React.Fragment>
        {this.state.modalView && <div className="modal is-active">
          <div className="modal-background"></div>
          <div className="modal-content">
            {this.state.selectedEvent.title}
            <button onClick={this.RSVP}>RSVP now!</button>  
          </div>
          <button className="modal-close is-large" aria-label="close" onClick={this.closeModal}></button>
        </div>}
        <div id="your-events" className="card">
          <header className="card-header">
            <p className="is-size-3 card-header-title is-size-6-touch">
              Your Events
          </p>
          </header>
          <div className="card-content">
            <div className="cardOrganizer">
              {SignedupEvents}
            </div>
          </div>
        </div>
        <div id="upcoming-events" className="card">
          <header className="card-header">
            <p className="is-size-3 card-header-title is-size-6-touch">
              Upcoming Events
          </p>
          </header>
          <div className="card-content cardOrganizer">
            {UpcomingEvents}
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default withRouter(Events);
