/*
functions that you guys might need:
  dateAvailable(date, schedule)
  listHourlyStartTimes(schedule)
  makeScheduleHourly(schedule)


date: JS Date Object
interval: array of 2 dates and additional data (status of interval). start date is stricly less than end date
schedule: array of intervals. the start dates of each interval are ordered, and the intervals are not overlapping
      note that the intervals could be intersecting, i.e., the first date of one equals the second date of another

hourly date: date is an exact hour, i.e., minutes, seconds, ms, etc. are all 0
hourly interval: start and end dates are hourly. NOT NECESSARILY 1 HOUR IN LENGTH
*/


// CORE FUNCTIONS
/*
returns whether date is available in schedule
*/
function dateAvailable(date, schedule) {
  const temp = largestIndex(date, schedule);
  if (temp == -1) return false;
  return dateBetween(date, schedule[temp][0], schedule[temp][1]) && schedule[temp][2] == "available";
}

/*
returns whether interval is available in schedule
*/
function intervalAvailable(interval, schedule) {
  const temp = largestIndex(interval[0], schedule);
  if (temp == -1) return false;
  return dateBetween(interval[0], schedule[temp][0], schedule[temp][1]) && dateBetween(interval[1], schedule[temp][0], schedule[temp][1]);
}

/*
inserts interval into schedule, returning nothing
the result is guaranteed to be a valid schedule that contains the new interval and all old intervals
*/
function insertInterval(interval, schedule) {
  // loop through schedule and change interval and remove old intervals
  for (let i = 0; i<schedule.length; i++) {
    let removeOriginalInterval = false;


    //if data is equal
    if(dataIsEqual(schedule[i], interval))
    {
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
      //if new interval is inside original interval, proceed as if new interval wasn't there
    }


    //if data is not equal
    else
    {
      // date 1 is between original interval
      if (dateBetween(interval[0], schedule[i][0], schedule[i][1])) {
        //shorten original interval on right side
        schedule[i][1] = interval[0];
      }
      // date 2 is between original interval
      if (dateBetween(interval[1], schedule[i][0], schedule[i][1])) {
        //shorten original interval on left side
        schedule[i][0] = interval[1];
      }
      // original interval is inside new interval
      if (dateBetween(schedule[i][0], interval[0], interval[1]) && dateBetween(schedule[i][1], interval[0], interval[1])) {
        // proceed as if original interval wasn't there
        removeOriginalInterval = true;
      }
      // new interval is inside original interval
      if (dateWithin(interval[0], schedule[i][0], schedule[i][1]) && dateWithin(interval[1], schedule[i][0], schedule[i][1])) {
        // split original interval in 2 by shortening it to one side and inserting another interval
        const newInterval = [interval[1], schedule[i][1]];
        schedule[i][1] = interval[0];
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
  schedule.splice(largestIndex(interval[0], schedule) + 1, 0, interval);
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

/*
returns a list of all hours within a schedule (inclusive left, exclusive right)
*/
function listHourlyStartTimes(schedule)
{
  const msInHour = 60 * 60 * 1000;
  var retList = [];
  for(var i = 0;i<schedule.length;i++)
  {
    var interval = schedule[i];
    var incrementingDate = ceilDate(interval[0]);
    while(interval[0].getTime() <= incrementingDate.getTime() && incrementingDate.getTime() < interval[1].getTime()) {
      //clone incrementingDate and add to return array
      retList.push(new Date(incrementingDate));
      incrementingDate.setTime(incrementingDate.getTime() + msInHour);
    }
  }
  return retList;
}

//Makes all intervals in schedule hourly. returns nothing
function makeScheduleHourly(schedule) {
  for(var i = 0;i<schedule.length;i++) {
    schedule[i] = getIntervalInHours(schedule[i]);
  }
}

// returns if schedule is disjoint and ordered
function verify(schedule) {
  if (schedule.length == 0) return true;
  let prevDate = new Date(1970, 0, 1);
  for (let i = 0; i<schedule.length; i++) {
    if (prevDate.getTime() > schedule[i][0].getTime()) return false;
    if (schedule[i][0].getTime() >= schedule[i][1].getTime()) return false;
    prevDate = schedule[i][1];
  }
  return true;
}


// HELPER FUNCTIONS
/*
checks if data of 2 intervals is equal
the way this happens depends on the usage of the metadata
in this case, checks if the strings are equal
*/
function dataIsEqual(firstInterval, secondInterval)
{
  return firstInterval[2] === secondInterval[2]
}

/*
returns an interval that is hourly by rounding the start date up and end date down
does NOT change original interval
*/
function getIntervalInHours(interval)
{
  return [ceilDate(interval[0]),floorDate(interval[1])];
}
// rounds date down to nearest hour
function floorDate(date)
{
  const msInHour = 60 * 60 * 1000;
  const ms = date.getTime();
  return new Date(Math.floor(date.getTime() / msInHour ) * msInHour);
}
//rounds date up to nearest hour
function ceilDate(date)
{
  const msInHour = 60 * 60 * 1000;
  const ms = date.getTime();
  return new Date(Math.ceil(date.getTime() / msInHour ) * msInHour);
}
//returns whether interval is valid
function intervalIsValid(interval)
{
  return interval[0] < interval[1];
}


// returns largest index such that schedule[index][0] <= date
function largestIndex(date, schedule) {
  let largestIndex = -1;
  for (let i = 0; i<schedule.length; i++) {
    if (schedule[i][0].getTime() <= date.getTime()) {
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


module.exports = {
  dateAvailable: dateAvailable,
  intervalAvailable: intervalAvailable,
  insertInterval: insertInterval,
  removeInterval: removeInterval,
  listHourlyStartTimes: listHourlyStartTimes,
  makeScheduleHourly: makeScheduleHourly,
  verify: verify,
};
