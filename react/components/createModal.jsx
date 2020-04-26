import React from "react";
import ReactDOM from "react-dom";

const modalEl = document.getElementById("modal");

const backgroundStyle = {
  backgroundColor: "#FFFFFF",
  borderRadius: "24px",
  padding: "24px",
}

class Modal extends React.Component {
  constructor(props) {
    super(props);

    this.onConfirm = this.onConfirm.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  onConfirm() {
    if (this.props.onConfirm) {
      this.props.onConfirm();
    }
    destroy();
  }

  onCancel() {
    if (this.props.onCancel) {
      this.props.onCancel();
    }
    destroy();
  }

  render() {
    return (
      <div className="modal is-active">
        <div className="modal-background"></div>
        <div className="modal-content" style={backgroundStyle}>
          <h1 className="title is-size-4">{this.props.message}</h1>
          <div className="field is-grouped">
            <p className="control">
              <a className="button is-danger" onClick={this.onConfirm}>
                Yes
              </a>
            </p>
            <p className="control">
              <a className="button is-light" onClick={this.onCancel}>
                No
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }
}

function destroy() {
  ReactDOM.unmountComponentAtNode(modalEl);
}

function push(message, onConfirm, onCancel) {
  ReactDOM.render(
    <Modal message={message} onConfirm={onConfirm} onCancel={onCancel} />,
    modalEl
  );
}

export default push;
