const getGuides = (page) => {
  return fetch(`/api/discover/page/${page}`).then((response) => response.json());
};

const getGuideSchedule = (id) => {
  return fetch('/api/discover/' + id + '/schedule').then((response) => response.json());
};

module.exports = {
  getGuides: getGuides,
  getGuideSchedule: getGuideSchedule,
};
