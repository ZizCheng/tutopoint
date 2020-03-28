import React from "react";
import ReactDOM from "react-dom";

import "./document.scss";
import documentAPI from "../api/document.js";

class DocumentCompactEntry extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="document-compact-entry-container">
        <p className="doucment-compact-entry-title">{this.props.document.title}</p>
        <p className="doucment-compact-entry-date">{this.props.document.date}</p>
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
  }

  componentDidMount() {
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
        compactEntryList.push(<DocumentCompactEntry document={document} key={document._id} />);
      }

      return (
        <div className="document-compact-list-container">
          <div className="document-compact-list-wrapper">
            {compactEntryList}
          </div>
        </div>
      );
    }
  }
}

export default DocumentCompactList;
