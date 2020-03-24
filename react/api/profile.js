const getProfile = () => {
  return fetch('/api/profile').then((response) => response.json());
};

const closeTutorial = () => {
  return fetch('/api/profile/closeTutorial').then((response) => response.json());
};


module.exports = {
  getProfile: getProfile,
  closeTutorial: closeTutorial,
};
