function newReview(guideID, review, star) {
  return fetch('/api/postcall/newreview/' + guideID, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({review: review, star: star}),
  }).then(function(response) {
    return response.json();
  });
}

function refer(email) {
  return fetch('/api/postcall/refer', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: email}),
  }).then(function(response) {
    return response.json();
  });
}

function report(guideID, report) {
  return fetch('/api/postcall/report/' + guideID, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({report: report}),
  }).then(function(response) {
    return response.json();
  });
}

module.exports = {
  newReview: newReview,
  refer: refer,
  report: report,
}
