const requestSession = (guideID, date) => {
  const data = {date: date, guideId: guideID};
  return fetch('/api/session/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then((resp) => resp.json());
};
const confirm = (id) => {
  return fetch('/api/session/confirm/' + id).then((response) => response.json());
};
const cancel = (id) => {
  return fetch('/api/session/cancel/' + id).then((response) => response.json());
};
const info = (id) => {
  return fetch('/api/session/' + id).then((response) => response.json());
};

module.exports = {
  requestSession: requestSession,
  confirm: confirm,
  cancel: cancel,
  info: info,
};
