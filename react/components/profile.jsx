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
    this.state = { profile: profileStore.getState(), changed: {} };

    this.change = this.change.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.unsubscribe = profileStore.subscribe(() => {
      this.setState({ profile: profileStore.getState() });
    });
  }

  componentWillUnmount() {
      this.unsubscribe()
  }

  change(e) {
    const field = e.target.getAttribute("name");
    const val = e.target.value;
    if (val != this.state.changed[field]) {
      let change = {};
      change[field] = val;
      this.setState({ changed: change });
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    if (Object.keys(this.state.changed).length > 0) {
      profileAPI.updateProfile(this.state.changed).then(msg => {
        if (msg.message == "ok") {
          profileAPI.getProfile().then(profile => {
            profileStore.dispatch({ type: "Initialize", data: profile });
          });
        }
      });
    }
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

    const referrals = this.state.profile?.referrals.referred?.map(
      (user, key) => {
        return (
          <tr key={key}>
            <td>{user.name}</td>
          </tr>
        );
      }
    );

    return (
      <div>
        <div className="tile is-ancestor">
          <div className="tile is-parent is-vertical is-5">
            <article className="tile is-child has-background-white">
              <p className="is-size-3">Edit Profile</p>
              <form id="editProfileForm" onSubmit={this.handleSubmit}>
                <div class="container is-fluid">
                  <div className="field is-horizontal">
                    <div className="field-label is-normal">
                      <label className="label">Name</label>
                    </div>
                    <div className="field-body">
                      <div className="field">
                        <div className="control">
                          <input
                            className="input"
                            type="text"
                            name="name"
                            onChange={this.change}
                            value={`${this.state.changed.name ||
                              this.state.profile?.name}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="field is-grouped is-grouped-right">
                    <p className="control is-expanded">
                      <a className="is-size-4" href="/reset">
                        Change password
                      </a>
                    </p>
                    <p className="control">
                      <input
                        type="submit"
                        className="button is-primary"
                        value="Apply Changes"
                      />
                    </p>
                  </div>
                </div>
              </form>
            </article>
            <article className="tile is-child has-background-white">
              <Appointments pastOnly={true} />
            </article>
          </div>
          <div className="tile is-vertical">
            <div className="tile">
              <div className="tile is-parent">
                <article className="tile is-child has-background-white">
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
                </article>
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
