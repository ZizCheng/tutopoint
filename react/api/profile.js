const getProfile = () => {
  return fetch('/api/profile').then((response) => response.json());
};
const requestReferralKey = () => {
  return fetch('/api/referral/create').then((response) => response.json());
};

const closeTutorial = () => {
  return fetch('/api/profile/closeTutorial').then((response) => response.json());
};

const updateProfile = (changes) => {
  const data = {data: changes};
  return fetch('/api/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then((resp) => resp.json());
};



module.exports = {
  getProfile: getProfile,
  closeTutorial: closeTutorial,
  updateProfile: updateProfile,
  requestReferralKey: requestReferralKey,
};
