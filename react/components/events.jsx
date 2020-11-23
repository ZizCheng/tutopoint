import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { NavLink } from 'react-router-dom';


import "./appointments.scss";
import event from "../api/events.js";
import store from "../store/store.js";

import { withRouter } from "react-router-dom";

class Events extends React.Component {
  constructor(props) {
    super(props);
    //this.state.profile is used to get sessions later
    this.state = {
      profile: store.getState().profileState,
    };
    event.getEvents().then((a) => {
        console.log(a);
    })

  }


  componentDidMount() {
    this.unsubscribe = store.subscribe(() => {
      this.setState({ profile: store.getState().profileState });
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }


  render() {

    return (
      <div id="appointments" className="card">
        <header className="card-header">
          <p className="is-size-3 card-header-title is-size-6-touch">
             Upcoming Events
          </p>
        </header>
        <div className="card-content">
            zeng
        </div>
      </div>
    );
  }
}

export default withRouter(Events);
