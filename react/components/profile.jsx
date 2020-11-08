import React from "react";
import "react-dom";
import "./profile.scss";
import { withRouter } from "react-router-dom";

import Appointments from "./appointments.jsx";
import QRCode from "qrcode.react";

import profileAPI from "../api/profile.js";

import profileStore from "../store/profileStore.js";

class Profile extends React.Component {
  constructor(props) {
    super(props);
    this.state =
    {
      profile: profileStore.getState(),
      changed: {},
      submitStatus: 0,
      zoomInstructions: false,
    };
    console.log(this.state.profile);

    this.submitCheckmarkTimeout = 0; //meaningless placeholder value

    this.change = this.change.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.requestReferralCode = this.requestReferralCode.bind(this);
    this.toggleZoomInstructions = this.toggleZoomInstructions.bind(this);
  }

  componentDidMount() {
    this.unsubscribe = profileStore.subscribe(() => {
      this.setState({ profile: profileStore.getState() });
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  change(e) {
    const field = e.target.getAttribute("name");
    var val = e.target.value;
    if(field == "freeFirstSession" || field == "chatNotifs") {
      val = e.target.checked;
    }
    console.log(e.target.value + " " + e.target.checked + " " + val);
    if (val != this.state.changed[field]) {
      let change = this.state.changed;
      change[field] = val;
      this.setState({ changed: change });
    }
  }

  handleSubmit(e) {
    e.preventDefault();

    if (Object.keys(this.state.changed).length > 0) {
      //clear checkmark timeout, set status to loading
      clearTimeout(this.submitCheckmarkTimeout);
      this.setState({ submitStatus: 1 });
      profileAPI.updateProfile(this.state.changed).then(msg => {
        //set status to checkmark
        this.setState({ submitStatus: 2 });
        //set timeout to set status to default after 500 ms
        this.submitCheckmarkTimeout = setTimeout(() => {
          this.setState({ submitStatus: 0 });
        }, 500);

        if (msg.message == "ok") {
          profileAPI.getProfile().then(profile => {
            profileStore.dispatch({ type: "Initialize", data: profile });
          });
        }
      });
    }
  }

  requestReferralCode() {
    profileAPI.requestReferralKey().then(msg => {
      if (msg.message == "ok") {
        profileAPI.getProfile().then(profile => {
          profileStore.dispatch({ type: "Initialize", data: profile });
        });
      }
    })
  }

  toggleZoomInstructions() {
    console.log("qwer");
    this.setState({
      zoomInstructions: !this.state.zoomInstructions
    });
  }

  render() {
    const transactionHistory = this.state.profile?.transactions?.data?.map(
      (transaction, key) => {
        const t_amount = (transaction.amount * -1) / 100;
        const t_endingBal = (transaction.ending_balance * -1) / 100;
        const note = transaction.description;
        const date = new Date(transaction.created * 1000).toLocaleDateString(
          "en-US"
        );
        return (
          <tr key={key}>
            <td>{date}</td>
            <td>{note}</td>
            <td>{t_amount}</td>
            <td>{t_endingBal}</td>
          </tr>
        );
      }
    );

    const referrals = this.state.profile?.referrals?.referred?.map(
      (user, key) => {
        return (
          <tr key={key}>
            <td>{user.name}</td>
          </tr>
        );
      }
    );

    var clientProfile =
      <div>
        <div className="field is-horizontal">
          <div className="field-label is-normal">
            <label className="label">Name</label>
          </div>
          <div className="field-body">
            <div className="field">
              <div className="control">
                <input className="input" type="text" name="name" onChange={this.change}
                  placeholder={this.state.profile?.name} value={`${this.state.changed.name || ""}`} />
              </div>
            </div>
          </div>
        </div>
        <div className="field-label">
          {this.state.profile?.freeFirstSessionAvailable &&
            <p className="has-text-success">You have a free session available! You can use it on any guide who accepts free first sessions.</p>}
        </div>
      </div>



    var gradeOptions = ["Freshman", "Sophomore", "Junior", "Senior", 'Graduated'];
    var gradeSelectOptions = gradeOptions.map((grade) => {
      if(this.state.profile?.grade == grade) return <option key={grade} value={grade} selected>{grade}</option>
      else return <option key={grade} value={grade}>{grade}</option>
    });

    var guideProfile =
      <React.Fragment>
        <div className="field is-horizontal">
          <div className="field-label is-normal">
            <label className="label">Bio</label>
          </div>
          <div className="field-body">
            <div className="field">
              <div className="control">
                <input className="input" type="text" name="bio" onChange={this.change}
                  placeholder={this.state.profile?.bio} value={`${this.state.changed.bio || ""}`}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="field is-horizontal">
          <div className="field-label is-normal">
            <label className="label">Major</label>
          </div>
          <div className="field-body">
            <div className="field">
              <div className="control">
                <input className="input" type="text" name="major" onChange={this.change}
                placeholder={this.state.profile?.major} value={`${this.state.changed.major || ""}`} />
              </div>
            </div>
          </div>
        </div>
        <div className="field is-horizontal">
          <div className="field-label is-normal">
            <label className="label">Grade</label>
          </div>
          <div className="field-body">
            <div className="field">
              <div className="control">
                {/*<input className="input" type="text" name="grade" onChange={this.change}
                placeholder={this.state.profile?.grade} value={`${this.state.changed.grade || ""}`} />*/}
                <div className="select">
                  <select name="grade" onChange={this.change}>
                    {gradeSelectOptions}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="field is-horizontal">
          <div className="field-label is-normal">
            <label className="label">Zoom meeting link</label>
          </div>
          <div className="field-body">
            <div className="field">
              <div className="control">
                <input className="input" type="text" name="zoomLink" onChange={this.change}
                placeholder={this.state.profile?.zoomLink} value={`${this.state.changed.zoomLink || ""}`} />
              </div>
            </div>
          </div>
        </div>

        <a onClick={this.toggleZoomInstructions} style={{color: "#0275d8"}}>Instructions for Zoom</a>
        <div className={`modal ${this.state.zoomInstructions ? 'is-active' : ''}`}>
          <div className="modal-background"></div>
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title">Getting your Zoom link</p>
              <button className="modal-close is-large" aria-label="close" onClick={this.toggleZoomInstructions}></button>
            </header>
            <section className="modal-card-body">
              <p>You will need a zoom account to meet with your clients.</p>
              <ol style={{marginLeft: "2rem"}}>
                <li>
                  In Zoom, <b>create a recurring personal meeting</b> (you might already
                  have one in the meetings tab, if not, click little arrow next to
                  New Meeting to create one)
                </li>
                <li>
                  Open your personal meeting invitation by clicking
                  show meeting invitation and <b>copy/paste just the link of the
                  invitation and add it to your profile</b> and hit apply changes
                </li>
              </ol>
              <br></br>
              Your link should look like this:
              <br></br>
              https://zoom.us/j/8641256592?pwd=ZG0yN3hRT3F3OHRjMytuL2V3djUwdz09
              <br></br><br></br>
              Note: please include the full URL, including the https://
            </section>
          </div>
        </div>
        <br></br><br></br>
        <div className="field is-horizontal">
          <label className="checkbox is-flex">
            <input className="checkbox-input" type="checkbox" name="freeFirstSession" onChange={this.change}
               checked={this.state.changed?.freeFirstSession ??
                 (this.state.profile?.freeFirstSession ?? false)} />
            <p>Allow free first sessions</p>
          </label>
        </div>
      </React.Fragment>

    return (
      <div>
        <div className="tile is-ancestor">
          <div className="tile is-parent is-vertical is-5">
            <article className="tile is-child has-background-white">
              <p className="is-size-3">Edit Profile</p>
              <form id="editProfileForm" onSubmit={this.handleSubmit}>
                <div className="container is-fluid">
                  {this.state.profile?.__t == "clients" && clientProfile}

                  {this.state.profile?.__t == "guides" && guideProfile}
                  <div className="field">
                    <p className="control is-expanded">
                      <a className="is-size-6" href="/reset">Change password</a>
                    </p>
                    <button type="submit" className="button is-primary apply-button">
                      <span style={{visibility: (this.state.submitStatus == 0 ? "visible" : "hidden")}}>Apply Changes</span>
                      <span className="profile-submit-icon-wrapper" style={{display: (this.state.submitStatus == 1 ? "block" : "none")}}>
                        <i className="fas fa-circle-notch fa-spin"></i>
                      </span>
                      <span className="profile-submit-icon-wrapper" style={{display: (this.state.submitStatus == 2 ? "block" : "none")}}>
                        <i className="fas fa-check"></i>
                      </span>
                    </button>
                  </div>
                  <div className="field is-horizontal">
                    <label className="checkbox is-flex">
                      <input className="checkbox-input" type="checkbox" name="chatNotifs" onChange={this.change}
                        checked={this.state.changed?.chatNotifs ??
                          (this.state.profile?.chatNotifs ?? false)} />
                       <p>Email me with chat notifications</p>
                    </label>
                  </div>
                </div>
              </form>
            </article>
            {this.state.profile?.__t != "guides" && (
              <article className="tile is-child has-background-white">
                <Appointments pastOnly={true} />
              </article>
            )}
          </div>
          <div className="tile is-vertical">
            {this.state.profile?.__t == "clients" && (
              <div className="tile">
                <div className="tile is-parent">
                  {this.state.profile?.referrals?.code ? (<article className="tile is-child has-background-white">
                    <p className="is-size-3">Referral Code</p>
                    <QRCode
                      id="QRDisplay"
                      value={`https://tutopoint.com/signup/${this.state.profile?.referrals.code}`}
                    />
                    <p className="is-size-3 has-text-centered">
                      Your code:{" "}
                      <span className="highlight">
                        {this.state.profile?.referrals.code}
                      </span>
                    </p>
                    <a
                      style={{
                        marginLeft: "auto",
                        marginRight: "auto",
                        display: "block"
                      }}
                      className="is-size-4 has-text-centered"
                      href={`https://tutopoint.com/signup/${this.state.profile?.referrals.code}`}
                    >{`https://tutopoint.com/signup/${this.state.profile?.referrals.code}`}</a>
                  </article>) : (<article className="tile is-child has-background-white">
                    <p className="is-size-3">Referral Code</p>
                    <button onClick={this.requestReferralCode} className="button is-large" style={{marginLeft: 'auto', marginRight: 'auto', display:'block'}}> Generate Referral Code </button>
                  </article>)}
                </div>
                <div className="tile is-parent">
                  <article className="tile is-child has-background-white">
                    <p className="is-size-3">Referral History</p>
                    <div
                      id="profile__referralHistory"
                      className="table-container"
                    >
                      <table className="table is-fullwidth">
                        <thead>
                          <tr>
                            <th>Name</th>
                          </tr>
                        </thead>
                        <tbody>{referrals}</tbody>
                      </table>
                    </div>
                  </article>
                </div>
              </div>
            )}
            <div className="tile is-parent">
              <article className="tile is-child has-background-white">
                <p className="is-size-3">Transaction History</p>
                <div className="table-container">
                  <table className="table is-fullwidth">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>{transactionHistory}</tbody>
                  </table>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Profile;
