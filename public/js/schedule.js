

//CALENDAR
//pass in any time within month
function newCalendar(date)
{
  $(".calendar-body").html("");

  var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  var lastDay = new Date(date.getFullYear(), date.getMonth()+1, 0);

  var rowCounter = 0;
  var row = document.createElement("tr");
  $(row).addClass("calendar-row");

  for(var i = 1-firstDay.getDay(); i<=lastDay.getDate();i++)
  {
    if(i>0) $(row).append(createDate(i));
    else $(row).append(createDate(0));

    rowCounter++;
    if(rowCounter == 7) {
      $(".calendar-body").append(row);
      row = document.createElement("tr");
      $(row).addClass("calendar-row");
      rowCounter = 0;
    }
  }
  if(row != 0) $(".calendar-body").append(row);
}
function createDate(date)
{
  var newDate = document.createElement("td");
  $(newDate).addClass("calendar-date")
  if(date>0)
  {
    $(newDate)
      .addClass("calendar-real-date")
      .html(date)
      .data("date",date)
      .click(function(){
        dateClick(this);
      });
  }
  return newDate;
}
function dateClick(dateEle)
{
  day = $(dateEle).data("date");
  newDay();
}





//DAY
function newDay()
{
  $(".day").html("");
  var dayStart = new Date(year, month, day);
  var dayEnd = new Date(year, month, day+1);
  for(var i = 0;i<schedule.length;i++) {
    if(dateBetween(schedule[i][0],dayStart,dayEnd) || dateBetween(schedule[i][1],dayStart,dayEnd)) {
      newInterval(schedule[i]);
    }
  }
  $(".day-container").show();
}
function newInterval(interval)
{
  var start = interval[0];
  var end = interval[1];
  var left = getLeftPosFromDate(start);
  var right = getRightPosFromDate(end);
  var intervalDiv = document.createElement("div");
  $(intervalDiv)
    .addClass("interval")
    .css({left: left, right: right})
    .data("start",start)
    .data("end",end)
    .mouseenter(function(){
      $(this).children(".remove-interval").show();
    })
    .mouseleave(function(){
      $(this).children(".remove-interval").hide();
    });
  var removeDiv = document.createElement("div");
  $(removeDiv)
    .addClass("remove-interval")
    .html("Remove")
    .hide()
    .click(function(event){
      event.stopPropagation();
      $(this).parent().remove();
    });

  var leftLabel = $(newIntervalLabel(start)).css({left: 0});
  var rightLabel = $(newIntervalLabel(end)).css({right: 0});

  $(".day").append(intervalDiv);
  $(intervalDiv).append(leftLabel).append(rightLabel).append(removeDiv);
}
function newIntervalLabel(date)
{
  var label = document.createElement("span");
  $(label)
    .addClass("interval-label")
    .html(formatDate(date))
  return label;
}



//SERVER
function saveSchedule()
{
  $.post("/save-schedule",{
    schedule: schedule
  });
}


//HELPER
function roundDate(date)
{
  var dateMs = date.getTime();
  var chunkMs = 1000*60*60/config.hourChunks;
  return new Date(Math.round(dateMs/chunkMs) * chunkMs);
}
function getDateFromLeftPos(offset)
{
  var percentDiff = offset/$(".day").width();
  var dayStart = new Date(year, month, day);
  var ret = dayStart.getTime() + 1000*60*60*24*percentDiff;
  return new Date(ret);
}
function getLeftPosFromDate(date)
{
  var dayStart = new Date(year, month, day);
  var dateDiff = date.getTime() - dayStart.getTime();
  var datePercentDiff = dateDiff/(1000*60*60*24);
  return $(".day").width() * datePercentDiff;
}
function getRightPosFromDate(date)
{
  var dayStart = new Date(year, month, day);
  var dateDiff = date.getTime() - dayStart.getTime();
  var datePercentDiff = dateDiff/(1000*60*60*24);
  return $(".day").width() * (1-datePercentDiff);
}
function formatDate(date)
{
  var minutes = date.getMinutes();
  if(minutes<10) minutes = "0" + minutes;
  return date.getHours() + ":" + minutes;
}










































//CORE FUNCTIONS
function dateAvailable(date, schedule)
{
  var temp = largestIndex(date,schedule);
  if(temp == -1) return false;
  return dateBetween(date, schedule[temp][0], schedule[temp][1]);
}
function intervalAvailable(interval, schedule)
{
  var temp = largestIndex(interval[0],schedule);
  if(temp == -1) return false;
  return dateBetween(interval[0], schedule[temp][0], schedule[temp][1]) && dateBetween(interval[1], schedule[temp][0], schedule[temp][1]);
}
//takes 1 second for 1 million calls
function insertInterval(interval, schedule)
{
  //loop through schedule and change interval and remove old intervals
  for(var i = 0;i<schedule.length;i++)
  {
    var removeOriginalInterval = false;
    //date 1 is between original interval
    if(dateBetween(interval[0],schedule[i][0],schedule[i][1])) {
      //expand interval left
      interval[0] = schedule[i][0];
      removeOriginalInterval = true;
    }
    //date 2 is between original interval
    if(dateBetween(interval[1],schedule[i][0],schedule[i][1])) {
      //expand interval right
      interval[1] = schedule[i][1];
      removeOriginalInterval = true;
    }
    //original interval is inside new interval
    if(dateBetween(schedule[i][0],interval[0],interval[1]) && dateBetween(schedule[i][1],interval[0],interval[1])) {
      //proceed as if original interval wasn't there
      removeOriginalInterval = true;
    }

    if(removeOriginalInterval) {
      schedule.splice(i,1);
      i--
    }
  }

  //add interval in front of largest index
  schedule.splice(largestIndex(interval[0],schedule) + 1, 0, interval);
}
function removeInterval(interval, schedule)
{
  for(var i = 0;i<schedule.length;i++)
  {
    //criss crossed
    if(dateWithin(interval[0], schedule[i][0], schedule[i][1]) && !dateWithin(interval[1], schedule[i][0], schedule[i][1]))
    {
      //move right side to interval left
      schedule[i][1] = interval[0];
    }
    if(!dateWithin(interval[0], schedule[i][0], schedule[i][1]) && dateWithin(interval[1], schedule[i][0], schedule[i][1]))
    {
      //move left side to interval right
      schedule[i][0] = interval[1];
    }
    //interval completely inside
    if(dateWithin(interval[0], schedule[i][0], schedule[i][1]) && dateWithin(interval[1], schedule[i][0], schedule[i][1]))
    {
      //split original interval in 2 by shortening it to one side and inserting another interval
      var newInterval = [interval[1], schedule[i][1]];
      schedule[i][1] = interval[0];
      schedule.splice(i+1,0,newInterval);
      i++;
    }
    //interval completely surround
    if(dateBetween(schedule[i][0],interval[0],interval[1]) && dateBetween(schedule[i][1],interval[0],interval[1]))
    {
      schedule.splice(i,1);
      i--;
    }
  }
}
//find all guides with available interval
function queryByDate(interval, Guides, callback)
{
  Guides.find({}).exec(function(err, guides)
  {
    var res = [];
    console.log(guides[0]);
    for(var i = 0;i<guides.length;i++)
    {
      guide = guides[i];
      if(!guide.schedule) continue;
      if(intervalAvailable(interval,guide.schedule))
      {
        res.push(guide);
      }
    }

    callback(res);
  });
}


//check if schedule is disjoint and ordered
function verify(schedule)
{
  if(schedule.length == 0) return true;
  var prevDate = new Date(1970, 0, 1);
  for(var i = 0;i<schedule.length;i++)
  {
    if(prevDate.getTime() >= schedule[i][0].getTime()) return false;
    if(schedule[i][0].getTime() >= schedule[i][1].getTime()) return false;
    prevDate = schedule[i][1];
  }
  return true;
}


//HELPER FUNCTIONS
//largest index such that schedule[index][0] <= date
function largestIndex(date,schedule)
{
  var largestIndex = -1;
  for(var i = 0;i<schedule.length;i++)
  {
    if(schedule[i][0].getTime() <= date.getTime()){
      largestIndex = i;
    }
  }
  return largestIndex;
}
//inclusive
function dateBetween(date, lower, upper)
{
  return (lower.getTime() <= date.getTime() && date.getTime() <= upper.getTime());
}
//exclusive
function dateWithin(date, lower, upper)
{
  return (lower.getTime() < date.getTime() && date.getTime() < upper.getTime());
}
