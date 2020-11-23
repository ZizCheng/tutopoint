function getEvents(){
    return fetch("/api/events/").then(a => a.json());
}

module.exports = {
    getEvents: getEvents,
}