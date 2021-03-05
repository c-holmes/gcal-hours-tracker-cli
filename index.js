const fs = require('fs');
const path = require('path');
const readline = require('readline');
const {google} = require('googleapis');
const inquirer = require('inquirer');
const googleAuth = require('./src/googleAuth');
const calendarService = require('./src/calendarService');
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

let filter = {};
const prevMonday = getPrevMonday();
let questions = [
  {
    type: 'input',
    name: 'dateFrom',
    message: 'Start date (YYYY-MM-DD)?',
    default: new Date(prevMonday).toISOString(),
  },
  {
    type: 'input',
    name: 'dateTo',
    message: 'End date (YYYY-MM-DD)?',
    default: new Date(prevMonday + 5.184e+8).toISOString(),
  }
];

/**
 * Returns the Date of the last Monday
 */
function getPrevMonday() {
  const currentDate = new Date();
  let day = currentDate.getDay();
  if (day === 1) {
    return currentDate - 6.048e+8;
  } else {
    return currentDate - (day * 8.64e+7);
  }
}

/**
 * Convert Milliseconds to Hours and Mins
 * @param {number} millis 
 */
function convertProjectTimeToHours(projects) {
  Object.entries(projects).forEach(([project, days]) => {
    Object.entries(days).forEach(([day, millis]) => {
      const hours = millis / 3.6e+6;
      const rHours = Math.floor(hours);
      const mins = Math.floor((hours - rHours) * 60);
      projects[project][day] = `${rHours}:${mins === 0 ? '00' : mins}`;
    });
  });
  return projects;
}

/**
 * Loop through Events and Group all events with the same docket id
 * @param {Array<Object>} events 
 */
function groupEventsById(events) {
  let projects = {};
  const eventsNoId = [];
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  events.map((event) => {
    const dayOfTheWeek = days[new Date(event.start).getDay()];
    const id = event.summary.match(/\d{4}/);
    const diffMilSecs = new Date(event.end) - new Date(event.start);
    const diffHrs = Math.floor((diffMilSecs % 86400000) / 3600000); // hours
    const diffMins = Math.round(((diffMilSecs % 86400000) % 3600000) / 60000); // minutes

    if (id === null) {
      eventsNoId.push(event);
    } else if (projects[id[0]] !== undefined) {
      if(projects[id[0]][dayOfTheWeek] === undefined) {
        projects[id[0]][dayOfTheWeek] = diffMilSecs;
      } else {
        projects[id[0]][dayOfTheWeek] += diffMilSecs; 
      }
    } else {
      projects[id[0]] = {};
      projects[id[0]][dayOfTheWeek] = diffMilSecs;
    }
  });
  projects = convertProjectTimeToHours(projects);
  return {projects, eventsNoId};
}

/**
 * Triggers call to googleAuth & calendarService to 
 * retrieve events from calendar api
 * @param {Object} filter with properties minDate, maxDate
 */
async function triggerCalendarAPI(filter) {
  const credentials = JSON.parse(fs.readFileSync('./credentials.json'));
  // TODO: Clean up error logs and Update to be more reusable
  // TODO: Add Debug logs
  try{
    const oAuth2Client = await googleAuth.genOAuthClient(credentials, SCOPES);
    const events = await calendarService.getGCalEvents(oAuth2Client, filter);
    // fs.writeFileSync('./events.json', JSON.stringify(events));
    // const events = JSON.parse(fs.readFileSync('./events.json'));
    const timesheet = groupEventsById(events);
    console.log(timesheet);
    return Promise.resolve(events);
  }catch(err){
    console.log(err);
    throw new Error('🤯 No records found');
  }
}

inquirer.prompt(questions).then(answers => {
  filter = {
    timeMin: answers['dateFrom'],
    timeMax: answers['dateTo'],
  }
  return triggerCalendarAPI(filter);
}).catch(err => {
  console.log('🤬🤬🤬 Error retrieving events from the calendar' + err)
});
