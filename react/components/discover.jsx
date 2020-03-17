import React from 'react';
import ReactDOM from 'react-dom';

import DiscoverGuideItem from './DiscoverGuideItem.jsx';

import './discover.scss';
import discoverAPI from '../api/discover.js';

class Discover extends React.Component {
    constructor(props) {
      super(props);
      this.state = ({topGuides: null});
    }

    componentDidMount(){
        discoverAPI
        .getGuides()
        .then((guides) => {
            this.setState({topGuides: guides})
        })
    }

    render() {

      const guides = this.state.topGuides?.map((guide, i) => {
            return <DiscoverGuideItem key={i} major={guide.major} name={guide.name} university={guide.university} grade={guide.grade} profilePic={guide.profilePic} backdrop={guide.backdrop}></DiscoverGuideItem>
      })

    
      return (
        <div id="appointments" className="card">
          <header className="card-header">
            <p className="is-size-3 card-header-title is-size-6-touch">
              Discover
            </p>
          </header>
          <div className="discover__guideWrapper card-content">
              {guides}
          </div>
        </div>
      );
    }
  }

export default Discover;