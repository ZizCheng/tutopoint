
function addRating(rating, ratings)
{
  return ratings.push(rating);
}
function calculateRating(ratings)
{
  var sum = 0;
  var numOfRatings = 0;
  for(var i = 0;i<ratings.length;i++)
  {
    numOfRatings += ratings[i];
    sum += (i+1) * ratings[i];
  }
  return sum/numOfRatings;
}

module.exports = {
  addRating: addRating,
  calculateRating: calculateRating
}
