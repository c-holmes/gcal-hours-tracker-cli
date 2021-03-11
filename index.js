const fs = require('fs');
const path = require('path');
const readline = require('readline');
const {google} = require('googleapis');
const inquirer = require('inquirer');
const googleAuth = require('./src/googleAuth');
const calendarService = require('./src/calendarService');
const {groupEventsById, getPrevMonday} = require('./src/calendarEvents');
const util = require('util')

// TODO: Only pull events you are attending
// TODO: Increase expiration date on refresh token
// TODO: Clean up error logs and Update to be more reusable
// TODO: Add Debug logs

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
 * Triggers call to googleAuth & calendarService to 
 * retrieve events from calendar api
 * @param {Object} filter with properties minDate, maxDate
 */
async function triggerCalendarAPI(filter) {
  const credentials = JSON.parse(fs.readFileSync('./credentials.json'));
  let events = {};
  try{
    if (process.argv[2] === 'test') {
      events = JSON.parse(fs.readFileSync('./test-events.json'));
    } else {
      const oAuth2Client = await googleAuth.genOAuthClient(credentials, SCOPES);
      events = await calendarService.getGCalEvents(oAuth2Client, filter);
      process.argv[2] === 'save-test' && fs.writeFileSync('./test-events.json', JSON.stringify(events));
    }
    
    const groupedEvents = groupEventsById(events);
    console.log(util.inspect(groupedEvents, {depth: null, colors: true, compact: false}))
    return Promise.resolve(groupedEvents);
  }catch(err){
    throw new Error('🤯 No records found', err);
  }
}

/** Starts CLI Program **/
inquirer.prompt(questions).then(answers => {
  filter = {
    timeMin: answers['dateFrom'],
    timeMax: answers['dateTo'],
  };
  return triggerCalendarAPI(filter);
}).catch(err => {
  console.log('🤬🤬🤬 Error retrieving events from the calendar' + err)
});
