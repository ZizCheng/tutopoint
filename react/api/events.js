function getEvents(){
    return fetch("/api/events/").then(a => a.json());
}

function RSVP(eventID, clientID){
    const data = {eventID: eventID, clientID: clientID}
    return fetch('/api/events/rsvp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        }).then((resp) => resp.json());
}

module.exports = {
    getEvents: getEvents,
    RSVP: RSVP,
}