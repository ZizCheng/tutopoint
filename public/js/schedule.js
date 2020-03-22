// CALENDAR
// pass in any time within month
function newCalendar(date) {
  $(".calendar-month-name").html(monthNames[date.getMonth()]);

  $(".calendar-body").html("");

  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  let eleInRow = 7;
  let row;

  for (
    let i = 1 - firstDay.getDay();
    i <= lastDay.getDate() + (6 - lastDay.getDay());
    i++
  ) {
    // create new row, using "row" variable
    if (eleInRow == 7) {
      row = createRow(new Date(year, month, i));
      eleInRow = 0;
    }

    // create date (or empty, placeholder date if i <= 0)
    if (i > 0 && i <= lastDay.getDate()) {
      const dateEle = createDate(i);
      $(row).append(dateEle);
      if (i == day) rowClicked($(dateEle).parent());
    } else $(row).append(createDate(0));

    eleInRow++;
    if (eleInRow == 7) {
      $(".calendar-body").append(row);
    }
  }
}
// firstDate: JS Date
function createRow(firstDate) {
  const newRow = document.createElement("tr");
  $(newRow)
    .addClass("calendar-row")
    .data("firstDate", firstDate)
    .click(function() {
      rowClicked(this);
    });
  return newRow;
}
// date: date in month, 1-31
function createDate(date) {
  const newDate = document.createElement("td");
  $(newDate).addClass("calendar-date");
  if (date > 0) {
    $(newDate)
      .addClass("calendar-real-date")
      .html(date);
  }
  return newDate;
}
function rowClicked(rowEle) {
  const firstDate = new Date($(rowEle).data("firstDate"));
  startOfWeek = firstDate;
  $(".calendar-selected-row").removeClass("calendar-selected-row");
  $(rowEle).addClass("calendar-selected-row");
  updateTimetable();
}

// TIMETABLE UPDATING
function updateTimetable() {
  $(".timetable-square-available").removeClass("timetable-square-available");
  const hourlyStartTimes = listHourlyStartTimes(schedule);
  const lower = startOfWeek;
  const upper = addDaysToDate(lower, 7);
  for (let i = 0; i < hourlyStartTimes.length; i++) {
    const date = hourlyStartTimes[i];
    if (dateBetween(date, lower, upper)) {
      // date is inside week
      const row = date.getHours();
      const col = date.getDay();
      $(".timetable-square-" + row + "-" + col).addClass(
        "timetable-square-available"
      );
    }
  }
}

// TIMETABLE CREATION
function createTimetable() {
  for (let i = 0; i < 24; i++) {
    const rowEle = document.createElement("tr");
    $(rowEle).append(newTimeLabel(i));
    for (let j = 0; j < 7; j++) {
      $(rowEle).append(newSquare(i, j));
    }
    $(".timetable-content").append(rowEle);
  }
}
function newTimeLabel(hour) {
  // get label text
  let period = "AM";
  if (hour >= 12) {
    period = "PM";
    hour -= 12;
  }
  if (hour == 0) hour = 12;
  const labelText = hour + " " + period;
  // create HTML
  const labelEle = document.createElement("td");
  $(labelEle)
    .addClass("timetable-cell timetable-time-label")
    .html(labelText);
  return labelEle;
}
function newSquare(row, col) {
  const squareEle = document.createElement("td");
  $(squareEle)
    .addClass(
      "timetable-cell timetable-square timetable-square-" + row + "-" + col
    )
    .data("row", row)
    .data("col", col)
    .click(function() {
      const row = $(this).data("row");
      const col = $(this).data("col");
      // get date of square
      // add [col] days to start of week, then set hours to row
      const startOfDay = addDaysToDate(startOfWeek, col);
      const start = new Date(startOfDay);
      start.setHours(row);
      const end = new Date(startOfDay);
      end.setHours(row + 1);

      const interval = [start, end, "available"];

      const insertType = $(
        ".insert-type-wrapper input[type='radio']:checked"
      ).val();
      if ($(this).hasClass("timetable-square-available")) {
        removeIntervalWithType(interval, insertType);
      } else {
        insertIntervalWithType(interval, insertType);
      }

      updateTimetable();
    });
  return squareEle;
}

// OPERATIONS
// oneTime, daily, weekly
function insertIntervalWithType(interval, insertType) {
  if (insertType == "oneTime") insertInterval(interval, schedule);
  if (insertType == "daily") insertIntervalDaily(interval);
  if (insertType == "weekly") insertIntervalWeekly(interval);
}
// insert interval for the next 28 days
function insertIntervalDaily(interval) {
  for (let i = 0; i < 28; i++) {
    insertInterval(addDaysToInterval(interval, i), schedule);
  }
}
// insert interval per day of week for next 4 weeks, starting on current day
function insertIntervalWeekly(interval) {
  for (let i = 0; i < 4; i++) {
    insertInterval(addDaysToInterval(interval, i * 7), schedule);
  }
}

// oneTime, daily, weekly
function removeIntervalWithType(interval, removeType) {
  if (removeType == "oneTime") removeInterval(interval, schedule);
  if (removeType == "daily") removeIntervalDaily(interval);
  if (removeType == "weekly") removeIntervalWeekly(interval);
}
// remove interval for the next 28 days
function removeIntervalDaily(interval) {
  for (let i = 0; i < 28; i++) {
    removeInterval(addDaysToInterval(interval, i), schedule);
  }
}
// remove interval per day of week for next 4 weeks, starting on current day
function removeIntervalWeekly(interval) {
  for (let i = 0; i < 4; i++) {
    removeInterval(addDaysToInterval(interval, i * 7), schedule);
  }
}

// CALCULATIONS
function addDaysToInterval(interval, days) {
  const newInterval = [];
  newInterval.push(addDaysToDate(interval[0], days));
  newInterval.push(addDaysToDate(interval[1], days));
  return newInterval;
}
function addDaysToDate(date, days) {
  const newDate = new Date(Number(date));
  newDate.setDate(date.getDate() + days);
  return newDate;
}
function roundDate(date) {
  const dateMs = date.getTime();
  const chunkMs = (1000 * 60 * 60) / config.hourChunks;
  return new Date(Math.round(dateMs / chunkMs) * chunkMs);
}
function getStartOfWeekFromDate(date) {
  // clone date
  const newDate = new Date(date);
  const day = newDate.getDay();
  const diff = newDate.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
  newDate.setDate(diff);
  // round down to nearest day
  const newDateMs = newDate.getTime();
  newDate.setTime(newDateMs - (newDateMs % (24 * 60 * 60 * 1000)));
  return newDate;
}

// SERVER COMMUNICATION
function saveSchedule() {
  $.post("/schedule", {
    schedule: JSON.stringify(schedule)
  });
}






// COPIED FROM BACK END

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
