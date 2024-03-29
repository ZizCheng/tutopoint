//same as createDocument except with placeholder title and empty text
function newDocument() {
  return fetch('/api/document', {
    method: 'POST',
  }).then(function(response) {
    return response.text();
  });
}

function createDocument(title, text) {
  return fetch('/api/document', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({title: title, text: text})
  }).then(function(response) {
    return response.text();
  });
}

function getDocumentTitle(id) {
  return fetch('/api/document/' + id + '/title').then(function(response) {
    return response.text();
  });
}

function getDocumentText(id) {
  return fetch('/api/document/' + id).then(function(response) {
    return response.json();
  });
}

function updateDocument(id, text, title) {
  return fetch('/api/document/' + id, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({text: text, title: title})
  }).then(function(response) {
    return response.text();
  });
}

function deleteDocument(id) {
  return fetch('/api/document/' + id, {
    method: 'DELETE',
  }).then(function(response) {
    return response.text();
  });
}

function listDocuments() {
  return fetch('/api/document').then(function(response) {
    return response.json();
  });
}

function sendDocument(id, sessionid) {
  return fetch('/api/document/' + id + '/send', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({sessionid: sessionid}),
  }).then(function(response) {
    return response.text();
  });
}

module.exports = {
  newDocument: newDocument,
  createDocument: createDocument,
  getDocumentTitle: getDocumentTitle,
  getDocumentText: getDocumentText,
  updateDocument: updateDocument,
  deleteDocument: deleteDocument,
  listDocuments: listDocuments,
  sendDocument: sendDocument,
}
