const getGuides = (page) => {
  return fetch(`/api/discover/page/${page}`).then((response) => response.json());
};

const getGuide = (id) => {
  return fetch(`/api/discover/${id}`).then((response) => response.json());
};

const getGuideSchedule = (id) => {
  return fetch('/api/discover/' + id + '/schedule').then((response) => response.json());
};

module.exports = {
  getGuides: getGuides,
  getGuide: getGuide,
  getGuideSchedule: getGuideSchedule,
};
