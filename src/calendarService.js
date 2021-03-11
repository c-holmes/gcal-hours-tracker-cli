const {google} = require('googleapis');
/**
 * Returns list of google calendar events
 * @param {google.auth.oAuth2} auth The Oauth client already authenticated
 * @param {Object} filter filter props to filter events by
 */
async function getGCalEvents(auth, filter) {
  try{
    const calendar = google.calendar({version: 'v3', auth});
    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: (new Date(filter.timeMin).toISOString()),
      timeMax: (new Date(filter.timeMax).toISOString()),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });
    const parsedEvents = events.data.items.map((event) => {
      if (checkIfValidEvent(event)) {
        return {
          summary: event.summary,
          start: event.start.dateTime,
          end: event.end.dateTime,
        };
      }
    });
    return Promise.resolve(parsedEvents.filter(event => event !== undefined));
  }catch(err){
    console.log(err);
  }
}

//TODO: Optimize this function
function checkIfValidEvent(event) {
  const email = 'chris.holmes@jam3.com';
  let isValid = event.creator.email === email;

  if (event.attendees !== undefined) {
    const user = event.attendees.find(attendee => attendee.email === email);
    if (user !== undefined) {
      isValid = user.responseStatus === 'accepted';
    }
  }

  return isValid;
}

module.exports = {getGCalEvents};