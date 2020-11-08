function newChat(userId) {
  return fetch('/api/chat/new', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({userId: userId}),
  }).then(function(response) {
    return response.json();
  });
}

function listChats() {
  return fetch('/api/chat/list').then(function(response) {
    return response.json();
  });
}
//find a chat given the other user's id; there should only be 1 mutual chat (only supports 1 to 1 chats)
function findChat(otherUserId) {
  return fetch('/api/chat/find?otherUserId=' + otherUserId).then(function(response) {
    return response.json();
  });
}
function getChat(chatId) {
  return fetch('/api/chat/' + chatId).then(function(response) {
    return response.json();
  });
}
//get all other users that this user is able to chat with
//for clients, this is all the guides
//for guides, this is all clients that booked them (or have booked them)
function getQualifiedUsers() {
  return fetch('/api/chat/qualified').then((response) => {
    return response.json();
  });
}

module.exports = {
  newChat: newChat,
  listChats: listChats,
  findChat: findChat,
  getChat: getChat,
  getQualifiedUsers: getQualifiedUsers,
}
