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
let questions = [
  {
    type: 'input',
    name: 'dateFrom',
    message: 'Start date (YYYY-MM-DD)?'
  },
  {
    type: 'input',
    name: 'dateTo',
    message: 'End date (YYYY-MM-DD)?'
  }
];

/**
 * Triggers call to googleAuth & calendarService to 
 * retrieve events from calendar api
 * @param {Object} filter with properties minDate, maxDate
 */
async function triggerCalendarAPI(filter) {
  const credentials = JSON.parse(fs.readFileSync('./credentials.json'));
  // TODO: Update this to more reusable error format
  // TODO: Add Debug logs
  try{
    const oAuth2Client = await googleAuth.genOAuthClient(credentials, SCOPES);
    debug('oAuthClient received, getting events....')
    const events = await calendarService.getGCalEvents(oAuth2Client, filter);
    console.log(events);
    return Promise.resolve(events);
  }catch(err){
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
