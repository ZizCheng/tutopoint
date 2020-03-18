import React from "react";
import ReactDOM from "react-dom";

import DiscoverGuideItem from "./DiscoverGuideItem.jsx";

import "./discover.scss";
import discoverAPI from "../api/discover.js";

class Discover extends React.Component {
  constructor(props) {
    super(props);
    this.state = { topGuides: null };

    this.handleGuideClicked = this.handleGuideClicked.bind(this);
  }

  componentDidMount() {
    discoverAPI.getGuides().then(guides => {
      this.setState({ topGuides: guides });
    });
  }

  handleGuideClicked(i) {
    const currentGuide = this.state.topGuides[i];

    this.setState({ focus: true, focusedGuide: currentGuide });
  }

  render() {
    const guides = this.state.topGuides?.map((guide, i) => {
      return (
        <DiscoverGuideItem
          key={i}
          major={guide.major}
          name={guide.name}
          university={guide.university}
          grade={guide.grade}
          profilePic={guide.profilePic}
          backdrop={guide.backdrop}
          onClick={() => {
            this.handleGuideClicked(i);
          }}
        ></DiscoverGuideItem>
      );
    });

    return (
      <React.Fragment>
        {this.state.focus && (
          <div className="overlay">
            <div className="overlay-center">
              <div id="discover__focusedGuide" className="card">
                <div className="columns">
                  <div class="column is-2">
                    <figure className="image is-1by1">
                      <img
                        src={
                          this.state.focusedGuide.profilePic
                            ? profilePic
                            : "https://bulma.io/images/placeholders/96x96.png"
                        }
                        alt="Placeholder image"
                      />
                    </figure>
                  </div>
                  <div class="column">
                    <h1 className="is-size-3 has-text-weight-bold">
                      {this.state.focusedGuide.name}
                    </h1>
                    <h2 className="is-size-4 highlight">
                      {this.state.focusedGuide.university},{" "}
                      {this.state.focusedGuide.grade} in{" "}
                      {this.state.focusedGuide.major}
                    </h2>

                    {/* <p className="is-size-6">Rating</p> */}
                    <p className="is-size-6 has-text-weight-bold">
                      {this.state.focusedGuide.bio}
                    </p>
                    <div class="tabs">
                      <ul>
                        <li class="is-active">
                          <a>Schedule</a>
                        </li>
                        <li>
                          <a>Reviews</a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div id="appointments" className="card">
          <header className="card-header">
            <p className="is-size-3 card-header-title is-size-6-touch">
              Discover
            </p>
          </header>
          <div className="discover__guideWrapper card-content">{guides}</div>
        </div>
      </React.Fragment>
    );
  }
}

export default Discover;
