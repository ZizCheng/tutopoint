import React from 'react';
import ReactDOM from 'react-dom';
import store from "../store/store.js";

const EventItem = ({ event, onClick, upcoming }) => {
    return (
        <div onClick={onClick} className={`card ${upcoming && "active"}`}>
            <div className="card-content">
                <div className="media">
                    <div className="media-content">
                        <p className="is-size-7 has-text-weight-bold">
                            {event?.title}
                    </p>
                        <p className="is-size-7 has-text-weight-bold">
                            {event?.date}
                    </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventItem;
