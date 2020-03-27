// THIS FILE IS ONLY USED IN DISCOVER ROUTER (AND TEST.JS)
// THIS FILE CAN BE REMOVED IF NEITHER ARE NEEDED ANYMORE
// A COPY IS IN REACT/API

/*

functions that you guys might need:

  dateAvailable(date, schedule)
      returns whether date is available in schedule (inclusive left, exclusive right)
  dateBooked(date, schedule)
      returns whether date is booked in schedule (inclusive left, exclusive right)
  bookDate(date, schedule)
      makes available time booked
      returns true if time was available, false if time was not
  unbookDate(date, schedule)
      makes booked time available
      returns true if time was booked, false if time was not
  listAvailableTimes(schedule)
      returns a list of all available hours within a schedule (inclusive left, exclusive right)
  listBookedTimes(schedule)
      returns a list of all booked hours within a schedule (inclusive left, exclusive right)

*/


// CORE FUNCTIONS
/*
returns whether date is available in schedule (inclusive left, exclusive right)
works for all dates, not just hourly dates
*/
function dateAvailable(date, schedule) {
  const temp = largestIndex(date, schedule);
  if (temp == -1) return false;
  return date >= schedule[temp].start && date < schedule[temp].end && schedule[temp].status == 'available';
}
/*
returns whether date is available in schedule (inclusive left, exclusive right)
works for all dates, not just hourly dates
*/
function dateBooked(date, schedule) {
  const temp = largestIndex(date, schedule);
  if (temp == -1) return false;
  return date >= schedule[temp].start && date < schedule[temp].end && schedule[temp].status == 'booked';
}

/*
returns whether interval is available in schedule
*/
function intervalAvailable(interval, schedule) {
  const temp = largestIndex(interval.start, schedule);
  if (temp == -1) return false;
  return dateBetween(interval.start, schedule[temp].start, schedule[temp].end) && dateBetween(interval.end, schedule[temp].start, schedule[temp].end);
}
/*
makes available time booked
returns true if time was available, false if time was not
only works for hourly dates
*/
function bookDate(date, schedule) {
  const index = findDate(date, schedule);
  if (index == -1) return false;
  schedule[index].status = 'booked';
  return true;
}
/*
makes booked time available
returns true if time was booked, false if time was not
*/
function unbookDate(date, schedule) {
  const index = findDate(date, schedule);
  if (index == -1) return false;
  schedule[index].status = 'available';
  return true;
}

/*
inserts available interval into schedule, returning nothing
the result is guaranteed to be a valid schedule that contains the new interval and all old intervals
*/
function insertInterval(interval, schedule) {
  // loop through schedule and change interval and remove old intervals
  for (let i = 0; i<schedule.length; i++) {
    let removeOriginalInterval = false;


    // if data is equal
    if (dataIsEqual(schedule[i], interval)) {
      // date 1 is within original interval
      if (dateWithin(interval.start, schedule[i].start, schedule[i].end)) {
        // expand interval left
        interval.start = schedule[i].start;
        removeOriginalInterval = true;
      }
      // date 2 is within original interval
      if (dateWithin(interval.end, schedule[i].start, schedule[i].end)) {
        // expand interval right
        interval.end = schedule[i].end;
        removeOriginalInterval = true;
      }
      // original interval is inside new interval
      if (dateBetween(schedule[i].start, interval.start, interval.end) && dateBetween(schedule[i].end, interval.start, interval.end)) {
        // proceed as if original interval wasn't there
        removeOriginalInterval = true;
      }
      // if new interval is inside original interval, proceed as if new interval wasn't there
    }


    // if data is not equal
    else {
      // date 1 is within original interval
      if (dateWithin(interval.start, schedule[i].start, schedule[i].end)) {
        // shorten original interval on right side
        schedule[i].end = interval.start;
      }
      // date 2 is within original interval
      if (dateWithin(interval.end, schedule[i].start, schedule[i].end)) {
        // shorten original interval on left side
        schedule[i].start = interval.end;
      }
      // original interval is inside new interval
      if (dateBetween(schedule[i].start, interval.start, interval.end) && dateBetween(schedule[i].end, interval.start, interval.end)) {
        // proceed as if original interval wasn't there
        removeOriginalInterval = true;
      }
      // new interval is inside original interval
      if (dateWithin(interval.start, schedule[i].start, schedule[i].end) && dateWithin(interval.end, schedule[i].start, schedule[i].end)) {
        // split original interval in 2 by shortening it to one side and inserting another interval
        const newInterval = [interval.end, schedule[i].end];
        schedule[i].end = interval.start;
        schedule.splice(i+1, 0, newInterval);
        i++;
      }
    }


    if (removeOriginalInterval) {
      schedule.splice(i, 1);
      i--;
    }
  }

  // add interval in front of largest index
  schedule.splice(largestIndex(interval.start, schedule) + 1, 0, interval);
}

/*
removes interval from schedule, returning nothing
the result is garunteed to be a valid schedule that does not contain interval
  and contains the old schedule otherwise
the data of the interval does not matter
*/
function removeInterval(interval, schedule) {
  for (let i = 0; i<schedule.length; i++) {
    // criss crossed
    if (dateWithin(interval.start, schedule[i].start, schedule[i].end) && !dateWithin(interval.end, schedule[i].start, schedule[i].end)) {
      // move right side to interval left
      schedule[i].end = interval.start;
    }
    if (!dateWithin(interval.start, schedule[i].start, schedule[i].end) && dateWithin(interval.end, schedule[i].start, schedule[i].end)) {
      // move left side to interval right
      schedule[i].start = interval.end;
    }
    // interval completely inside
    if (dateWithin(interval.start, schedule[i].start, schedule[i].end) && dateWithin(interval.end, schedule[i].start, schedule[i].end)) {
      // split original interval in 2 by shortening it to one side and inserting another interval
      const newInterval = [interval.end, schedule[i].end];
      schedule[i].end = interval.start;
      schedule.splice(i+1, 0, newInterval);
      i++;
    }
    // interval completely surround (or exactly the same)
    if (dateBetween(schedule[i].start, interval.start, interval.end) && dateBetween(schedule[i].end, interval.start, interval.end)) {
      schedule.splice(i, 1);
      i--;
    }
  }
}

/*
returns a list of all available hours within a schedule (inclusive left, exclusive right)
*/
function listAvailableTimes(schedule) {
  const msInHour = 60 * 60 * 1000;
  const retList = [];
  for (let i = 0; i<schedule.length; i++) {
    const interval = schedule[i];
    if (interval.status != 'available') continue;

    const incrementingDate = ceilDate(interval.start);
    while (interval.start.getTime() <= incrementingDate.getTime() && incrementingDate.getTime() < interval.end.getTime()) {
      // clone incrementingDate and add to return array
      retList.push(new Date(incrementingDate));
      incrementingDate.setTime(incrementingDate.getTime() + msInHour);
    }
  }
  return retList;
}

/*
returns a list of all booked hours within a schedule (inclusive left, exclusive right)
*/
function listBookedTimes(schedule) {
  const msInHour = 60 * 60 * 1000;
  const retList = [];
  for (let i = 0; i<schedule.length; i++) {
    const interval = schedule[i];
    if (interval.status != 'booked') continue;

    const incrementingDate = ceilDate(interval.start);
    while (interval.start.getTime() <= incrementingDate.getTime() && incrementingDate.getTime() < interval.end.getTime()) {
      // clone incrementingDate and add to return array
      retList.push(new Date(incrementingDate));
      incrementingDate.setTime(incrementingDate.getTime() + msInHour);
    }
  }
  return retList;
}


// HELPER FUNCTIONS
/*
checks if data of 2 intervals is equal
the way this happens depends on the usage of the metadata
in this case, checks if the strings are equal
*/
function dataIsEqual(firstInterval, secondInterval) {
  return firstInterval.status === secondInterval.status;
}

// rounds date up to nearest hour
function ceilDate(date) {
  const msInHour = 60 * 60 * 1000;
  const ms = date.getTime();
  return new Date(Math.ceil(date.getTime() / msInHour ) * msInHour);
}


// returns largest index such that schedule[index].start <= date
function largestIndex(date, schedule) {
  let largestIndex = -1;
  for (let i = 0; i<schedule.length; i++) {
    if (schedule[i].start.getTime() <= date.getTime()) {
      largestIndex = i;
    }
  }
  return largestIndex;
}
// checks if date is between 2 bounds, inclusive
function dateBetween(date, lower, upper) {
  return (lower.getTime() <= date.getTime() && date.getTime() <= upper.getTime());
}
// checks if date is between 2 bounds, exclusive
function dateWithin(date, lower, upper) {
  return (lower.getTime() < date.getTime() && date.getTime() < upper.getTime());
}
// find index of start time
function findDate(date, schedule) {
  for (let i = 0; i<schedule.length; i++) {
    if (schedule[i].start.getTime() === date.getTime()) {
      return i;
    }
  }
  return -1;
}


module.exports = {
  dateAvailable: dateAvailable,
  dateBooked: dateBooked,
  bookDate: bookDate,
  unbookDate: unbookDate,
  intervalAvailable: intervalAvailable,
  insertInterval: insertInterval,
  removeInterval: removeInterval,
  listAvailableTimes: listAvailableTimes,
  listBookedTimes: listBookedTimes,
  findDate: findDate,
};
