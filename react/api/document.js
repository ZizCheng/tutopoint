function newDocument() {
  return fetch('/api/document', {
    method: 'POST',
  }).then(function(response) {
    return response.json();
  });
}

function getDocumentText(id) {
  return fetch('/api/document/' + id).then(function(response) {
    return response.text();
  });
}

function updateDocument(id, data) {
  return fetch('/api/document/' + id, {
    method: 'PUT',
    body: data,
  }).then(function(response) {
    return response.text();
  });
}

function listDocuments() {
  return fetch('/api/document').then(function(response) {
    return response.json();
  });
}

module.exports = {
  newDocument: newDocument,
  getDocumentText: getDocumentText,
  updateDocument: updateDocument,
  listDocuments: listDocuments,
}
