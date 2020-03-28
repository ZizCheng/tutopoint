import React from "react";
import ReactDOM from "react-dom";
import { withRouter } from "react-router";

import Quill from "quill";

import "./document.scss";
import documentAPI from "../api/document.js";

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
    documentAPI.updateDocument(this.state.doc_id, this.state.quill.getContents());
  }

  componentDidMount() {
    this.setState({
      quill: new Quill("#quill-editor", {
        "theme": 'snow',
      })
    });
  }

  render() {
    if(this.state.quill !== null)
    {
      documentAPI.getDocumentText(this.state.doc_id).then((data) => {
        this.state.quill.setContents(data);
      });
    }
    return (
      <div className="document-edit-container">
        <div id="quill-editor"></div>
        <button className="button" onClick={this.saveDocument}>Save</button>
      </div>
    );
  }
}

const DocumentEdit = withRouter(DocumentEditWithoutRouter);

export default DocumentEdit;
