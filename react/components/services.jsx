import React from "react";
import { withRouter } from "react-router-dom";
import "./services.scss";
import ReactDOM from "react-dom";

class Services extends React.Component {
  render() {
    return (
      <div className="services-container">
        <h1 className="title">How it Works</h1>
        <div className="services-wrapper">
          <div className="service">
            <img className="service-image" src="/images/service1.svg" />
            <p className="service-title">College Consulting</p>
            <p className="service-body">
              Getting started with the process, we will tell you everything you need to know.<br /><br />
              We can help package your child to match what top schools look for, starting anywhere, anytime.<br /><br />
              Tailored, personalized solutions to unlock your child’s full potential for top universities to see.
            </p>
          </div>
          <div className="service">
            <img className="service-image" src="/images/service2.svg" />
            <p className="service-title">High School Planning</p>
            <p className="service-body">
              What courses to take in high school and when to take them, aligned
                    with your child’s future college, major, and career path.<br /><br />
              What to do over the summers. Internships, summer camps, where to go
                    and how to apply, we will help maximize your productivity over the summer months.<br /><br />
              AP/IB, when to take ACT/SAT, subject tests, etc. Which test is right for me?<br />
              Tips to let your child stay ahead in high school (how to study, time management).
            </p>
          </div>
          <div className="three-row-break"></div>
          <div className="service">
            <img className="service-image" src="/images/service3.svg" />
            <p className="service-title">Extracurriculars</p>
            <p className="service-body">
              Clubs, sports, leadership, volunteering, personalized to fit what your child likes and should do.<br /><br />
              Competitions, national contests worth participating in. How to prepare, how to get ahead.<br /><br />
              Tailoring to the future, we help identify which activities your child should
                    do in high school to get into their dream school
            </p>
          </div>
          <div className="two-row-break"></div>
          <div className="service">
            <img className="service-image" src="/images/service4.svg" />
            <p className="service-title">Application/Essay Writing</p>
            <p className="service-body">
              Essay brainstorming, what to talk about, how to answer prompts.<br /><br />
              Revising/editing essays to stand out in the admission room.<br /><br />
              How to write your EC section, what to include in your common app and what not.
            </p>
          </div>
          <div className="three-row-break"></div>
          <div className="service">
            <img className="service-image" src="/images/service6.png" />
            <p className="service-title">Tutoring</p>
            <p className="service-body">
              Our guides were once students, and they can tutor almost all high school classes.<br /><br />
              Have a quick question about a class or an assignment? Our guides can help you out.<br /><br />
              APs, IB, ACT/SAT, high school courses, standardized testing, we can tutor too!
            </p>
          </div>
          <div className="service placeholder-service"></div>
        </div>
      </div>
    );
  }
}

export default withRouter(Services);
