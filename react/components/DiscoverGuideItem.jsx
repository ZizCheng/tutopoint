import React from 'react';
import ReactDOM from 'react-dom';

const DiscoverGuideItem = ({ major, name, university, grade, profilePic, backdrop }) => {
    return (
      <div className="card dashboard__discoverGuide_Item">
        <div className="card-image">
          <figure className="image is-2by1">
            <img
              src={backdrop ? backdrop : "https://bulma.io/images/placeholders/640x320.png"}
              alt="Placeholder image"
            />
          </figure>
        </div>
        <div className="card-content">
          <div className="media">
            <div className="media-left">
              <figure className="image is-96x96">
                <img
                  className="is-rounded"
                  src={profilePic ? profilePic : "https://bulma.io/images/placeholders/96x96.png"}
                  alt="Placeholder image"
                />
              </figure>
            </div>
            <div className="media-content">
              <p className="is-size-6 has-text-weight-bold">
                {name} at <span className="highlight">{university}</span>
              </p>
              <p className="is-size-6 has-text-weight-bold">
                {grade} at <span className="highlight">{major}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

export default DiscoverGuideItem;