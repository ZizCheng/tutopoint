import React from "react";
import ReactDOM from "react-dom";

import Quill from "quill";

import "./document.scss";
import documentAPI from "../api/document.js";

class DocumentCard extends React.Component {
  constructor(props) {
    super(props);

    this.cardClick = this.cardClick.bind(this);
  }
  cardClick(e) {
    documentAPI.getDocumentText(this.props.document._id).then(function(data) {
      console.log(data);
    });
  }
  render() {
    return (
      <div className="document-card column is-2" onClick={this.cardClick}>
        <div className="document-card-top">
          Placeholder text.<br />
          Going to change to document text later<br />
          more placeholder more placeholder more placeholder
        </div>
        <div className="document-card-bottom">
          <div className="document-card-bottom-left">
            <p className="document-title">{this.props.document.title}</p>
            <p className="document-date">{this.props.document.date.toLocaleDateString("en-US")}</p>
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

    this.state = {
      documents: [],
    };

    this.newDocumentClick = this.newDocumentClick.bind(this);
  }

  componentDidMount() {
    documentAPI.listDocuments().then((data) => {
      //convert JSON date to JS date
      for(var document of data) {
        document.date = new Date(document.date);
      }
      this.setState({
        documents: data
      });
    });
  }

  newDocumentClick(e) {
    documentAPI.newDocument().then(function(data) {
      cosnole.log(data);
    });
  }

  render() {
    var documentCards = [];
    for(const document of this.state.documents)
    {
      documentCards.push(<DocumentCard document={document} key={document._id} />);
    }

    return (
      <div className="document-container">
        <div className="document-wrapper">
          <div className="document-container-top">
            <div className="document-new-container">
              <div className="document-new" onClick={this.newDocumentClick}>
                New Document
              </div>
            </div>
          </div>
          <div className="document-container-bottom">
            <div className="document-grid">
              <div className="document-row columns">
                {documentCards}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Documents;
