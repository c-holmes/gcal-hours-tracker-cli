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
      return {
        summary: event.summary,
        status: event.status,
        start: event.start.dateTime,
        end: event.end.dateTime,
      };
    });
    return parsedEvents;
  }catch(err){
    console.log(err);
  }
}

module.exports = {getGCalEvents};