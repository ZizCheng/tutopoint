import React from 'react';
import ReactDOM from 'react-dom';
import store from "../store/store.js";

const DiscoverGuideItem = ({ guide, onClick }) => {
    return (
      <div onClick={onClick} className="card dashboard__discoverGuide_Item">
        <div className="card-image">
          <figure className="image is-2by1">
            <img
              src={guide.backdrop ? guide.backdrop : "https://bulma.io/images/placeholders/640x320.png"}
              alt="Placeholder image"
            />
          </figure>
        </div>
        <div className="card-content">
          <div className="media">
            <div className="media-left">
              <figure className="image is-64x64">
                <img className="is-rounded" src={guide.profilePic ? guide.profilePic : "https://bulma.io/images/placeholders/64x64.png"} alt="Placeholder image"
                />
              </figure>
            </div>
            <div className="media-content">
              <p className="is-size-7 has-text-weight-bold">
                {guide.name} at <span className="highlight">{guide.university}</span>
              </p>
              <p className="is-size-7 has-text-weight-bold">
                {guide.grade} &mdash; <span className="highlight">{guide.major}</span>
              </p>
              {guide.freeFirstSession ? (
                <p className="is-size-7 has-text-weight-bold has-text-success">
                  Free first session
                </p>
              ) : ""}
              {/*
              <p className="is-size-7 has-text-weight-bold highlight" style={{cursor: "pointer"}} onClick={(e) => {
                e.stopPropagation();
                store.dispatch({type: "chat/guideIdUpdate", data: guide._id});
                console.log(guide);
              }}>
                Start a chat
              </p>
              */}
            </div>
          </div>
        </div>
      </div>
    );
  };

export default DiscoverGuideItem;
