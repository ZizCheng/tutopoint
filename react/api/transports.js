const getSession = (id) => {
  const data = {roomid: id};
  return fetch('/api/transports/connect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then((resp) => resp.json());
};


const transportConnect = (roomid, {transportsId, dtlsParameters}, type = "produce") => {
  const data = {roomid: roomid, transportsId: transportsId, dtlsParameters: dtlsParameters, type: type};
  return fetch('/api/transports/transportConnect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then((resp) => resp.json());
};

const transportProduce = (roomid, data) => {
  data['roomid'] = roomid;
  return fetch('/api/transports/transportProduce', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then((resp) => resp.json());
};

const transportRecv = (roomid, data) => {
  data['roomid'] = roomid;
  return fetch('/api/transports/transportsReceive', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then((resp) => resp.json());
}

module.exports = {
  getSession: getSession,
  transportConnect: transportConnect,
  transportProduce: transportProduce,
  transportRecv: transportRecv,
};
