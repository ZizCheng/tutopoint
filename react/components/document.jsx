import React from "react";
import ReactDOM from "react-dom";

import "./document.scss";
import documentAPI from "../api/document.js";

class DocumentCard extends React.Component {
  constructor(props) {
    super(props);

    this.cardClick = this.cardClick.bind(this);
  }
  cardClick(e) {
    var id = this.props.id;
    documentAPI.getDocument(id).then(function(data) {
      alert(data);
    });
  }
  render() {
    return (
      <div className="document-card" onClick={this.cardClick}>
        <div className="document-card-top">
          Placeholder text.<br />
          Going to change to document text later<br />
          more placeholder more placeholder more placeholder
        </div>
        <div className="document-card-bottom">
          <div className="document-card-bottom-left">
            Notes with Ziz Cheng
            2/19/2020
          </div>
          <div className="document-card-bottom-right">

          </div>
        </div>
      </div>
    );
  }
}
class Documents extends React.Component {
  constructor(props) {
    super(props);

    this.newDocumentClick = this.newDocumentClick.bind(this);
  }

  newDocumentClick(e) {
    documentAPI.newDocument().then(function(data) {
      cosnole.log(data);
    });
  }

  render() {
    return (
      <div className="document-container">
        <div className="document-container-top">
          <div className="document-new-container">
            <div className="document-new" onClick={this.newDocumentClick}>
              New Document
            </div>
          </div>
        </div>
        <div className="document-container-bottom">
          <div className="document-grid">
            <div className="document-row">
              <DocumentCard />
              <DocumentCard />
            </div>
          </div>
        </div>
      </div>

    );
  }
}

export default Documents;
