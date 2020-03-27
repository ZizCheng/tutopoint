function newDocument() {
  return fetch('/api/document', {
    method: 'POST',
  }).then((response) => response.json());
}

function getDocument(id) {
  //reads stream to completion
  return fetch('/api/document/' + id).then((response) => response.json());
}

function updateDocument(id, data) {
  return fetch('/api/document/' + id, {
    method: 'PUT',
    body: data,
  }).then((response) => response.json());
}
