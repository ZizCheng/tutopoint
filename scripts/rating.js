
function calculateRating(ratings) {
  let sum = 0;
  let numOfRatings = 0;
  for (let i = 0; i<ratings.length; i++) {
    numOfRatings += ratings[i];
    sum += (i+1) * ratings[i];
  }
  return sum/numOfRatings;
}

module.exports = {
  addRating: addRating,
  calculateRating: calculateRating,
};
