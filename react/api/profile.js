const getProfile = () => {
  return fetch('/api/profile').then((response) => response.json());
};


module.exports = {
  getProfile: getProfile,
};
