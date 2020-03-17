const getGuides = () => {
  return fetch('/api/discover').then((response) => response.json());
};

module.exports = {
  getGuides: getGuides,
};
