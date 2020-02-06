
// CORE FUNCTIONS
function dateAvailable(date, schedule) {
  const temp = largestIndex(date, schedule);
  if (temp == -1) return false;
  return dateBetween(date, schedule[temp][0], schedule[temp][1]);
}
function intervalAvailable(interval, schedule) {
  const temp = largestIndex(interval[0], schedule);
  if (temp == -1) return false;
  return dateBetween(interval[0], schedule[temp][0], schedule[temp][1]) && dateBetween(interval[1], schedule[temp][0], schedule[temp][1]);
}
// takes 1 second for 1 million calls
function insertInterval(interval, schedule) {
  // loop through schedule and change interval and remove old intervals
  for (let i = 0; i<schedule.length; i++) {
    let removeOriginalInterval = false;
    // date 1 is between original interval
    if (dateBetween(interval[0], schedule[i][0], schedule[i][1])) {
      // expand interval left
      interval[0] = schedule[i][0];
      removeOriginalInterval = true;
    }
    // date 2 is between original interval
    if (dateBetween(interval[1], schedule[i][0], schedule[i][1])) {
      // expand interval right
      interval[1] = schedule[i][1];
      removeOriginalInterval = true;
    }
    // original interval is inside new interval
    if (dateBetween(schedule[i][0], interval[0], interval[1]) && dateBetween(schedule[i][1], interval[0], interval[1])) {
      // proceed as if original interval wasn't there
      removeOriginalInterval = true;
    }

    if (removeOriginalInterval) {
      schedule.splice(i, 1);
      i--;
    }
  }

  // add interval in front of largest index
  schedule.splice(largestIndex(interval[0], schedule) + 1, 0, interval);
}
function removeInterval(interval, schedule) {
  for (let i = 0; i<schedule.length; i++) {
    // criss crossed
    if (dateWithin(interval[0], schedule[i][0], schedule[i][1]) && !dateWithin(interval[1], schedule[i][0], schedule[i][1])) {
      // move right side to interval left
      schedule[i][1] = interval[0];
    }
    if (!dateWithin(interval[0], schedule[i][0], schedule[i][1]) && dateWithin(interval[1], schedule[i][0], schedule[i][1])) {
      // move left side to interval right
      schedule[i][0] = interval[1];
    }
    // interval completely inside
    if (dateWithin(interval[0], schedule[i][0], schedule[i][1]) && dateWithin(interval[1], schedule[i][0], schedule[i][1])) {
      // split original interval in 2 by shortening it to one side and inserting another interval
      const newInterval = [interval[1], schedule[i][1]];
      schedule[i][1] = interval[0];
      schedule.splice(i+1, 0, newInterval);
      i++;
    }
    // interval completely surround
    if (dateBetween(schedule[i][0], interval[0], interval[1]) && dateBetween(schedule[i][1], interval[0], interval[1])) {
      schedule.splice(i, 1);
      i--;
    }
  }
}
// find all guides with available interval
function queryByDate(interval, Guides, callback) {
  Guides.find({}).exec(function(err, guides) {
    const res = [];
    console.log(guides[0]);
    for (let i = 0; i<guides.length; i++) {
      guide = guides[i];
      if (!guide.schedule) continue;
      if (intervalAvailable(interval, guide.schedule)) {
        res.push(guide);
      }
    }

    callback(res);
  });
}


// check if schedule is disjoint and ordered
function verify(schedule) {
  if (schedule.length == 0) return true;
  let prevDate = new Date(1970, 0, 1);
  for (let i = 0; i<schedule.length; i++) {
    if (prevDate.getTime() >= schedule[i][0].getTime()) return false;
    if (schedule[i][0].getTime() >= schedule[i][1].getTime()) return false;
    prevDate = schedule[i][1];
  }
  return true;
}


// HELPER FUNCTIONS
// largest index such that schedule[index][0] <= date
function largestIndex(date, schedule) {
  let largestIndex = -1;
  for (let i = 0; i<schedule.length; i++) {
    if (schedule[i][0].getTime() <= date.getTime()) {
      largestIndex = i;
    }
  }
  return largestIndex;
}
// inclusive
function dateBetween(date, lower, upper) {
  return (lower.getTime() <= date.getTime() && date.getTime() <= upper.getTime());
}
// exclusive
function dateWithin(date, lower, upper) {
  return (lower.getTime() < date.getTime() && date.getTime() < upper.getTime());
}


module.exports = {
  dateAvailable: dateAvailable,
  intervalAvailable: intervalAvailable,
  insertInterval: insertInterval,
  removeInterval: removeInterval,
  queryByDate: queryByDate,
  verify: verify,
};
