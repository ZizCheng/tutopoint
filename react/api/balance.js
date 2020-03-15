const pay = (token, amount, save) => {
  const data = {token: token, amount: amount, save: save};
  return fetch('/api/balance/pay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then((resp) => resp.json());
};


module.exports = {
  pay: pay,
};
