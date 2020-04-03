import React, { useEffect, setState, useState } from "react";
import { withRouter } from "react-router-dom";
import "./help.scss";
import ReactDOM from "react-dom";

class Help extends React.Component {
  render() {
    return (
      <div className="content">
        <h1 className="title">How it Works</h1>
        <ol className="helpList">
          <li className="is-size-5 is-size-6-mobile">
            In our <a href="/discover">discover</a> page, find one of our guides that you want to
            speak to.
          </li>
          <li className="is-size-5 is-size-6-mobile">
            Refill your <a href="/balance">balance</a> to at least $60 before booking a session.
            All of our guides cost $60 an hour.
          </li>
          <li className="is-size-5 is-size-6-mobile">
            Write down any questions you might have in a new questionnaire
            <a href="/documents">document</a> and send it to your guide so they can prepare. You can send
            the questionnaire in appointments once you book a session.
          </li>
          <li className="is-size-5 is-size-6-mobile">
            Once the guide confirms the session, you have until 24 hours before
            the session time to cancel your booking in <a href="/appointments">appointments</a>.
          </li>
          <li className="is-size-5 is-size-6-mobile">
            The first 5 minutes of your session is always free. The guide will
            receive your money after the first 5 minutes.
          </li>
          <li className="is-size-5 is-size-6-mobile">
            During the hour with your guide, ask any questions you have prepared or think of. Our guides
            are here to help you answer those questions and give you all the information they have that you might want.
          </li>
          <li className="is-size-5 is-size-6-mobile">
            Every 15 minutes after the first hour will cost an additional $15,
            if your <a href="/balance">balance</a> does not have enough to extend a session
            automatically, your session will end 5 minutes after the hour is
            complete.
          </li>
          <li className="is-size-5 is-size-6-mobile">
            After the session is complete, you can leave a rating and a review
            for the guide. If you like them enough, book another session!
          </li>
        </ol>
      </div>
    );
  }
}

export default withRouter(Help);
