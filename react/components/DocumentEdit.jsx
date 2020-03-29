import React from "react";
import ReactDOM from "react-dom";
import { withRouter } from "react-router";

import Quill from "quill";

import "./document.scss";
import documentAPI from "../api/document.js";

//no props; get document using url param (id)
class DocumentEditWithoutRouter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      doc_id: props.match.params.id,
      quill: null,
    }

    this.saveDocument = this.saveDocument.bind(this);
  }

  saveDocument() {
    documentAPI.updateDocument(this.state.doc_id, this.state.quill.getContents(), document.getElementById("document-edit-title").value);
  }

  componentDidMount() {
    this.setState({
      quill: new Quill("#quill-editor", {
        "theme": 'snow',
      })
    });
  }

  render() {
    //title
    documentAPI.getDocumentTitle(this.state.doc_id).then((data) => {
      document.getElementById("document-edit-title").value = data;
    });
    //text
    if(this.state.quill !== null)
    {
      documentAPI.getDocumentText(this.state.doc_id).then((data) => {
        //error
        //most likely happens if user creates a document and immediately accesses it.
        //The document will not be uploaded to s3 in time
        if(data == 'error') alert("Something went wrong. Please refresh the page and try again.");
        this.state.quill.setContents(data);
      });
    }
    return (
      <div className="document-edit-cotnainer">
        <div className="document-edit-header">
          <input type="text" id="document-edit-title" value={this.state.doc_title} />
        </div>
        <div className="document-edit-wrapper">
          <div id="quill-editor"></div>
        </div>
        <button className="button" onClick={this.saveDocument}>Save</button>
      </div>
    );
  }
}

const DocumentEdit = withRouter(DocumentEditWithoutRouter);

export default DocumentEdit;
