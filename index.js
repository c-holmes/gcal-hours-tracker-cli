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
    console.log(events);
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
