

// CALENDAR
// pass in any time within month
function newCalendar(date) {
  $('.calendar-body').html('');

  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth()+1, 0);

  let rowCounter = 0;
  let row = document.createElement('tr');
  $(row).addClass('calendar-row');

  for (let i = 1-firstDay.getDay(); i<=lastDay.getDate(); i++) {
    if (i>0) $(row).append(createDate(i));
    else $(row).append(createDate(0));

    rowCounter++;
    if (rowCounter == 7) {
      $('.calendar-body').append(row);
      row = document.createElement('tr');
      $(row).addClass('calendar-row');
      rowCounter = 0;
    }
  }
  if (row != 0) $('.calendar-body').append(row);
}
function createDate(date) {
  const newDate = document.createElement('td');
  $(newDate).addClass('calendar-date');
  if (date>0) {
    $(newDate)
        .addClass('calendar-real-date')
        .html(date)
        .data('date', date)
        .click(function() {
          $(".calendar-selected-date").removeClass("calendar-selected-date");
          $(this).addClass("calendar-selected-date");
          day = $(this).data('date');
          newDay($(".day"));
        });
  }
  return newDate;
}


// DAY
function newDay(dayEle) {
  $('.day-container').show();
  $(dayEle).html('');
  const dayStart = new Date(year, month, day);
  const dayEnd = new Date(year, month, day+1);
  for (let i = 0; i<schedule.length; i++) {
    if (dateBetween(schedule[i][0], dayStart, dayEnd) || dateBetween(schedule[i][1], dayStart, dayEnd)) {
      $(dayEle).append(newInterval(schedule[i]));
    }
  }
  for(let i = 0;i<24;i++) {
    var hourDate = new Date(year, month, day, i);
    var timeLabel = newTimeLabel(hourDate);
    var timeLabelLine = newTimeLabelLine(hourDate);
    $(".time-labels").append(timeLabel);
    $(dayEle).append(timeLabelLine);
  }

  $(dayEle).mousemove(function(event){
    var top = event.pageY - $(".day").offset().top;
    var date = getDateFromTopPos(top);
    moveCursor(date);
  });
  $(dayEle).click(function(event){
    var top = event.pageY - $(".day").offset().top;
    var date = getDateFromTopPos(top);
    var roundedDate = roundDate(date);

    if(!firstDate)
    {
      firstDate = roundedDate;
    }
    else
    {
      secondDate = roundedDate;
      //vars must be ordered, distinct dates
      if(firstDate.getTime() != secondDate.getTime())
      {
        //make sure times are ordered
        if(firstDate.getTime() > secondDate.getTime()) {
          var temp = firstDate;
          firstDate = secondDate;
          secondDate = temp;
        }
        //insert type
        var insertType = $(".insert-type-wrapper input[type='radio']:checked").val();
        insertIntervalWithType([firstDate,secondDate],insertType);
        newDay(this); //update day to show change
        firstDate = null;
      }
    }
  })
}
//create the yellow block
function newInterval(interval) {
  const start = interval[0];
  const end = interval[1];
  const top = getTopPosFromDate(start);
  const bottom = getBottomPosFromDate(end);
  const intervalDiv = document.createElement('div');
  $(intervalDiv)
      .addClass('interval')
      .css({"top": top, "bottom": bottom})
      .data('start', start)
      .data('end', end)
      .mouseenter(function() {
        $(this).children('.remove-interval').show();
      })
      .mouseleave(function() {
        $(this).children('.remove-interval').hide();
      });
  const removeButton = document.createElement('button');
  $(removeButton)
      .addClass('remove-interval button')
      .html('Remove')
      .css({"z-index": "2"})
      .hide()
      .click(function(event) {
        event.stopPropagation();
        $(this).parent().remove();
      });

  const label = document.createElement("div");
  $(label)
      .addClass('interval-label')
      .html(formatHHMM(start) + " &ndash; " + formatHHMM(end));

  $(intervalDiv).append(label).append(removeButton);
  return intervalDiv;
}
//create a time label
function newTimeLabel(date) {
  const labelSpacer = document.createElement('div');
  $(labelSpacer)
    .addClass('time-label-spacer')
    .css({"height": getHeightPerHour()});
  const labelText = document.createElement('span');
  $(labelText)
    .addClass("time-label-text")
    .html(formatHHPP(date));
  $(labelSpacer).append(labelText);
  return labelSpacer;
}
function newTimeLabelLine(date) {
  const labelLine = document.createElement('div');
  $(labelLine)
    .addClass('time-label-line')
    .css({"top": getTopPosFromDate(date)});
  return labelLine;
}





function moveCursor(date) {
  var roundedDate = roundDate(date);
  var cursorTop = getTopPosFromDate(roundedDate);
  $(".cursor").css({"top": cursorTop});
  $(".cursor-text").html(formatHHMM(roundedDate))
}


//CALCULATIONS
//oneTime, daily, weekly
function insertIntervalWithType(interval, insertType)
{
  if(insertType == "oneTime") insertInterval(interval, schedule);
  if(insertType == "daily") insertIntervalDaily(interval);
  if(insertType == "weekly") insertIntervalWeekly(interval);
}
//insert interval for the next 28 days
function insertIntervalDaily(interval) {
  for(var i = 0;i<28;i++) {
    insertInterval(addDaysToInterval(interval,i),schedule);
  }
}
//insert interval per day of week for next 4 weeks, starting on current day
function insertIntervalWeekly(interval) {
  for(var i = 0;i<4;i++) {
    insertInterval(addDaysToDate(interval,i*7),schedule);
  }
}
function addDaysToInterval(interval, days) {
  var newInterval = [];
  newInterval.push(addDaysToDate(interval[0],days));
  newInterval.push(addDaysToDate(interval[1],days));
  return newInterval;
}
function addDaysToDate(date, days) {
  var newDate = new Date(Number(date));
  newDate.setDate(date.getDate() + days);
  return newDate;
}
function roundDate(date) {
  const dateMs = date.getTime();
  const chunkMs = 1000*60*60/config.hourChunks;
  return new Date(Math.round(dateMs/chunkMs) * chunkMs);
}


//SERVER COMMUNICATION
function saveSchedule() {
  $.post('/schedule', {
    schedule: schedule,
  });
}


// UI HELPER
function getDateFromTopPos(offset) {
  const percentDiff = offset/$('.day').height();
  const dayStart = new Date(year, month, day);
  const ret = dayStart.getTime() + 1000*60*60*24*percentDiff;
  return new Date(ret);
}
function getTopPosFromDate(date) {
  const dayStart = new Date(year, month, day);
  const dateDiff = date.getTime() - dayStart.getTime();
  const datePercentDiff = dateDiff/(1000*60*60*24);
  return $('.day').height() * datePercentDiff;
}
function getBottomPosFromDate(date) {
  const dayStart = new Date(year, month, day);
  const dateDiff = date.getTime() - dayStart.getTime();
  const datePercentDiff = dateDiff/(1000*60*60*24);
  return $('.day').height() * (1-datePercentDiff);
}
function getHeightPerHour() {
  return $('.day').height()/24;
}
//HH:MM
function formatHHMM(date) {
  var minutes = date.getMinutes();
  if (minutes<10) minutes = '0' + minutes;
  return date.getHours() + ':' + minutes;
}
//HH PP
//P is the period, or AM/PM
function formatHHPP(date) {
  var hour = date.getHours();
  var period = "AM";
  if(hour >= 12)
  {
    period = "PM";
    hour -= 12;
  }
  if(hour == 0) hour = 12;
  return hour + ' ' + period;
}


















// SAME AS BACK END

// CORE FUNCTIONS
function dateAvailable(date, schedule) {
  const temp = largestIndex(date, schedule);
  console.log(temp);
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
