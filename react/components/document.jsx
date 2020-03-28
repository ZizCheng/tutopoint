import React from "react";
import ReactDOM from "react-dom";
import { withRouter } from 'react-router-dom';

import Quill from "quill";

import "./document.scss";
import documentAPI from "../api/document.js";

class DocumentCardWithoutRouter extends React.Component {
  constructor(props) {
    super(props);

    this.state =  {
      document: this.props.document
    }

    this.cardClick = this.cardClick.bind(this);
    this.deleteClick = this.deleteClick.bind(this);
  }

  cardClick(e) {
    this.props.history.push("/documents/" + this.state.document._id);
  }
  deleteClick(e) {
    documentAPI.deleteDocument(this.state.document._id).then((data) => {
      this.props.updateParentDocumentState();
    });
  }

  componentDidMount() {
    //set text field in state
    documentAPI.getDocumentText(this.state.document._id).then((doc_text) => {
      var docClone = {...this.state.document};
      docClone.text = doc_text;
      this.setState({
        document: docClone
      });
    });
    //quill is only needed once, so initialize here
    var quill = new Quill("#quill-viewer-" + this.state.document._id, {
      "theme": 'snow',
      "modules": {
          "toolbar": false
      }
    });
    quill.disable();
    documentAPI.getDocumentText(this.state.document._id).then((data) => {
      quill.setContents(data);
    });
  }

  render() {
    return (
      <div className="document-card-wrapper">
        <div className="document-card">
          <div className="document-card-top">
            <div className="quill-viewer" id={"quill-viewer-" + this.state.document._id}></div>
          </div>
          <div className="document-card-bottom">
            <div className="document-card-bottom-top">
              <p className="document-title" onClick={this.cardClick}>{this.state.document.title}</p>
            </div>
            <div className="document-card-bottom-bottom">
              <p className="document-date">{this.state.document.date.toLocaleDateString("en-US")}</p>
              <p className="document-delete" onClick={this.deleteClick}><i className="fa fa-trash" aria-hidden="true"></i></p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const DocumentCard = withRouter(DocumentCardWithoutRouter);

class Documents extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      documents: [],
    };

    this.newDocumentClick = this.newDocumentClick.bind(this);
    this.updateDocumentState = this.updateDocumentState.bind(this);
  }

  updateDocumentState() {
    documentAPI.listDocuments().then((documentList) => {
      for(var document of documentList) {
        //convert JSON date to JS date
        document.date = new Date(document.date);
      }
      this.setState({
        documents: documentList
      });
    });
  }

  newDocumentClick(e) {
    documentAPI.newDocument().then((data) => {
      this.updateDocumentState();
    });
  }

  componentDidMount() {
    this.updateDocumentState();
  }

  render() {
    var documentCards = [];
    for(var i = 0;i<this.state.documents.length;i++)
    {
      const document = this.state.documents[i];
      documentCards.push(<DocumentCard document={document} key={document._id}
        updateParentDocumentState={this.updateDocumentState} />);
    }

    return (
      <div className="document-container">
        <div className="document-wrapper">
          <div className="document-container-top">
            <div className="document-header">Documents</div>
            <div className="document-new" onClick={this.newDocumentClick}>
              <span className="document-new-plus">+</span>
            </div>
          </div>
          <div className="document-container-bottom">
            <div className="document-list">
              {documentCards}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Documents;
