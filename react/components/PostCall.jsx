import React from "react";
import ReactDOM from "react-dom";

import {Link} from 'react-router-dom';

import "./PostCall.scss";
import reviewAPI from "../api/review.js";

class PostCall extends React.Component {
  constructor(props) {
    super(props);
    this.state = {guideName: null, guideID: null}
  }

  toggleReportModal() {
    if(document.getElementById("report-modal").classList.contains("is-active"))
    {
      document.getElementById("report-modal").classList.remove("is-active")
    }
    else document.getElementById("report-modal").classList.add("is-active");
  }
  toggleRecommendModal() {
    if(document.getElementById("recommend-modal").classList.contains("is-active"))
    {
      document.getElementById("recommend-modal").classList.remove("is-active")
    }
    else document.getElementById("recommend-modal").classList.add("is-active");
  }
  goDashboard() {
    window.location.href="/dashboard";
  }

  componentDidMount() {

  }

  submitReview() {
    reviewAPI.newReview(this.state.guideID, document.getElementById("review-box").value, 0);
    window.location.href="/dashboard";
  }

  submitReport() {
    reviewAPI.report(this.state.guideID, document.getElementById("report-box").value);
    toggleReportModal();
    document.getElementById("report-button").disabled = true;
  }

  submitInvite() {
    reviewAPI.refer(document.getElementById("invite-box").value);
    toggleRecommendModal();
    document.getElementById("invite-button").disabled = true;
  }

  render() {
    return (
      <div className="postcall-wrapper">
        <div className="postcall-picture-wrapper">
          <figure className="image is-128x128">
            <img className="is-rounded" src="https://bulma.io/images/placeholders/128x128.png" />
          </figure>
        </div>
        <div className="postcall-text-wrapper">
          Thanks for using TutoPoint!<br />
          Please rate your session with Ziz Cheng
        </div>
        <div className="postcall-bottom">
          <div className="postcall-action-wrapper">
            <div className="postcall-star-wrapper">
              <div className="postcall-star postcall-star-1"><i className="fas fa-star"></i></div>
              <div className="postcall-star postcall-star-2"><i className="fas fa-star"></i></div>
              <div className="postcall-star postcall-star-3"><i className="fas fa-star"></i></div>
              <div className="postcall-star postcall-star-4"><i className="fas fa-star"></i></div>
              <div className="postcall-star postcall-star-5"><i className="fas fa-star"></i></div>
            </div>
            <div className="postcall-buttons-wrapper">
              <button id="report-button" className="postcall-report-button button is-outlined" onClick={this.toggleReportModal}>Report</button>
              <button id="invite-button" className="postcall-recommend-button button is-primary is-outlined" onClick={this.toggleRecommendModal}>Recommend</button>
            </div>
          </div>
          <div className="postcall-review-wrapper">
            <textarea className="textarea" id="review-box" placeholder="Type your review here."></textarea>
          </div>
          <button className="postcall-submit-button button is-primary" onClick={this.submitReview}>Submit Review</button>
          <div className="is-divider" data-content="or"></div>
          <button type="button" className="postcall-back-button button is-dark" onClick={this.goDashboard}>Back to Dashboard</button>
        </div>

        <div id="report-modal" className="modal">
          <div className="modal-background"  onClick={this.toggleReportModal}></div>
          <div className="modal-content">
            <h1 className="title">Report User</h1>
            <p>Sorry about that!</p>
            <textarea className="textarea" id="report-box" placeholder="Tell us what went wrong."></textarea>
            <button className="submit-button button is-primary" onClick={this.submitReport}>Submit</button>
          </div>
          <button className="modal-close is-large" aria-label="close" onClick={this.toggleReportModal}></button>
        </div>

        <div id="recommend-modal" className="modal">
          <div className="modal-background"  onClick={this.toggleRecommendModal}></div>
          <div className="modal-content">
            <h1 className="title">Refer a friend!</h1>
            <p>Would your friends like {}? Fill in an email below and we will send them an invite. You receive credit every time they have a session!</p>
            <p>Email:</p><input className="recommend-email" id="invite-box" type="email" />
            <button className="submit-button button is-primary" onClick={this.submitInvite}>Invite</button>
          </div>
          <button className="modal-close is-large" aria-label="close"  onClick={this.toggleRecommendModal}></button>
        </div>
      </div>
    );
  }
}

export default PostCall;
