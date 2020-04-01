import React from "react";
import ReactDOM from "react-dom";

import "./PostCall.scss";

class PostCall extends React.Component {
  constructor(props) {
    super(props);
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

  componentDidMount() {

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
              <button className="postcall-report-button button is-outlined" onClick={this.toggleReportModal}>Report</button>
              <button className="postcall-recommend-button button is-primary is-outlined" onClick={this.toggleRecommendModal}>Recommend</button>
            </div>
          </div>
          <div className="postcall-review-wrapper">
            <textarea className="textarea" placeholder="Type your review here."></textarea>
          </div>
          <button className="postcall-submit-button button is-primary">Submit Review</button>
          <div className="is-divider" data-content="or"></div>
          <button className="postcall-back-button button is-dark">Back to Dashboard</button>
        </div>
        <div id="report-modal" className="modal">
          <div className="modal-background"  onClick={this.toggleReportModal}></div>
          <div className="modal-content">
            <h1 className="title">Report User</h1>
            <p>Sorry about that!</p>
            <textarea className="textarea" placeholder="Tell us what went wrong."></textarea>
            <button className="submit-button button is-primary">Submit</button>
          </div>
          <button className="modal-close is-large" aria-label="close" onClick={this.toggleReportModal}></button>
        </div>
        <div id="recommend-modal" className="modal">
          <div className="modal-background"  onClick={this.toggleRecommendModal}></div>
          <div className="modal-content">
            <p>Email:</p><input className="recommend-email" type="email" />
          </div>
          <button className="modal-close is-large" aria-label="close"  onClick={this.toggleRecommendModal}></button>
        </div>
      </div>
    );
  }
}

export default PostCall;
