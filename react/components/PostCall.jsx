/*
Sample usage in app.jsx (for now), at /postcall

pass in props:
rating: the average rating of the guide, as a decimal
submit: a function with parameters (rating, review) that is called when submitted
    rating is -1 by default and review is blank by default. This is not filtered out.
    Tell jason how you want to handle partial or fully empty responses
reportSubmit: function with parameters (reportText) that is called when report submit button is clicked
recommendSubmit: function with parameters (recommendEmail) that is called when recommend submit button is clicked

*/

import React from "react";
import ReactDOM from "react-dom";

import {Link} from 'react-router-dom';
import {withRouter} from 'react-router';
import StarRatings from 'react-star-ratings';

import "./PostCall.scss";
import reviewAPI from "../api/postcall.js";
import sessionAPI from "../api/session.js";

class PostCall extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      rating: -1, guideName: null, guideID: null, profilePic: null
    }

    this.changeRating = this.changeRating.bind(this);
    this.submit = this.submit.bind(this);
    this.recommendSubmit = this.recommendSubmit.bind(this);
    this.reportSubmit = this.reportSubmit.bind(this);
    this.goDashboard = this.goDashboard.bind(this);
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
    reviewAPI.newReview(this.state.guideID, null, 0);
    this.props.history.push('/dashboard');
  }

  changeRating(newRating, name) {
    this.setState({
      rating: newRating
    });
  }

  submit() {
    var rating = this.state.rating;
    var review = document.getElementById("review-textarea").value;
    reviewAPI.newReview(this.state.guideID, review, rating);
    this.props.history.push('/dashboard');
  }
  reportSubmit() {
    var reportText = document.getElementById("report-textarea").value;
    reviewAPI.report(this.state.guideID, reportText);
    this.toggleReportModal();
    document.getElementById("report-button").setAttribute('disabled', 'true');
  }
  recommendSubmit() {
    var recommendEmail = document.getElementById("recommend-email").value;
    reviewAPI.refer(recommendEmail);
    this.toggleRecommendModal();
    document.getElementById("invite-button").setAttribute('disabled', 'true');
  }

  componentDidMount() {
    sessionAPI.info(this.props.match.params.id)
      .then((session) => {
        this.setState({guideName: session.createdBy.name, guideID: session.createdBy._id, profilePic: session.createdBy.profilePic})
      })
      .catch((err) => console.log(err));
  }

  render() {
    return (

      <div className="postcall-wrapper">
        <div className="postcall-picture-wrapper">
          <figure className="image is-128x128">
            <img className="is-rounded" src={this.state.profilePic} />
          </figure>
        </div>
        <div className="postcall-text-wrapper">
          Thanks for using TutoPoint!<br />
          Please rate your session with {this.state.guideName}
        </div>
        <div className="postcall-bottom">
          <div className="postcall-action-wrapper">
            <div className="postcall-star-wrapper">
              <StarRatings
                rating={this.state.rating}
                changeRating={this.changeRating}
                starDimension="32px"
                starRatedColor="rgb(230, 67, 47)"
                numberOfStars={5}
                name='rating'
                starRatedColor="blue"
              />
            </div>

            <div className="postcall-buttons-wrapper">
              <button id="report-button" className="postcall-report-button button is-outlined" onClick={this.toggleReportModal}>Report</button>
              <button id="invite-button" className="postcall-recommend-button button is-primary is-outlined" onClick={this.toggleRecommendModal}>Recommend</button>
            </div>
          </div>
          <div className="postcall-review-wrapper">
            <textarea id="review-textarea" className="textarea" placeholder="Type your review here."></textarea>
          </div>
          <button className="postcall-submit-button button is-primary" onClick={this.submit}>Submit Review</button>
          <div className="is-divider" data-content="or"></div>
          <button type="button" className="postcall-back-button button is-dark" onClick={this.goDashboard}>Back to Dashboard</button>
        </div>

        <div id="report-modal" className="modal">
          <div className="modal-background"  onClick={this.toggleReportModal}></div>
          <div className="modal-content">
            <h1 className="title">Report User</h1>
            <p>Sorry about that!</p>
            <textarea id="report-textarea" className="textarea" placeholder="Tell us what went wrong."></textarea>
            <button className="submit-button button is-primary" onClick={this.reportSubmit}>Submit</button>
          </div>
          <button className="modal-close is-large" aria-label="close" onClick={this.toggleReportModal}></button>
        </div>

        <div id="recommend-modal" className="modal">
          <div className="modal-background"  onClick={this.toggleRecommendModal}></div>
          <div className="modal-content">
            <h1 className="title">Refer a friend!</h1>
            <p>Would your friends like {this.state.guideName}? Fill in an email below and we will send them an invite. You receive credit every time they have a session!</p>
            <p>Email:</p><input className="recommend-email" id="recommend-email" type="email" />
            <button className="submit-button button is-primary" onClick={this.recommendSubmit}>Invite</button>
          </div>
          <button className="submit-button button is-primary" onClick={this.recommendSubmit}>Submit</button>
          <button className="modal-close is-large" onClick={this.toggleRecommendModal} aria-label="close"></button>
        </div>
      </div>

    );
  }
}

export default withRouter(PostCall);
