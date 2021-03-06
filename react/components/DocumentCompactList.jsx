import React from "react";
import ReactDOM from "react-dom";

import "./document.scss";
import documentAPI from "../api/document.js";

class DocumentCompactEntry extends React.Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.props.action(this.props.document._id);
  }

  render() {
    return (
      <div className="document-compact-entry-container" onClick={this.handleClick}>
        <p className="document-compact-entry-title column is-7">{this.props.document.title}</p>
        <p className="document-compact-entry-date column is-5">{this.props.document.date.toLocaleDateString("en-US")}</p>
      </div>
    )
  }
}


/*
renders a list of documents containing only their titles and dates
takes in 1 property:
    action(doc_id): function that is ran when document is clicked
*/
class DocumentCompactList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      documents: null,
    }
  }

  componentDidMount() {
    documentAPI.listDocuments().then((documentList) => {
      for(var document of documentList) {
        //convert JSON date to JS date
        document.date = new Date(document.date);
      }
      this.setState({
        documents: documentList,
        action: this.props.action ? this.props.action : function() {},
      });
    });
  }

  render() {
    if(!this.state.documents) {
      return (
        <div>Loading</div>
      )
    }
    else {
      var compactEntryList = [];
      for(const document of this.state.documents)
      {
        compactEntryList.push(<DocumentCompactEntry document={document} key={document._id} action={this.props.action} />);
      }

      return (
        <div className="document-compact-list-container">
          <div className="document-compact-list-header">
            {compactEntryList.length > 0 ? (
              <>
              <p className="document-compact-entry-title column is-7">Title</p>
              <p className="document-compact-entry-date column is-5">Date</p>
              </>
            ) : ""}
          </div>
          {compactEntryList}
        </div>
      );
    }
  }
}

export default DocumentCompactList;
