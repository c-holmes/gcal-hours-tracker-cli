const WEEK_IN_MILLIS = 6.048e+8;
const DAY_IN_MILLIS = 8.64e+7;
const HOUR_IN_MILLIS = 3.6e+6;
const MIN_IN_MILLIS = 60000;

/**
 * Returns the Date of the last Monday
 */
function getPrevMonday() {
  const currentDate = new Date();
  let day = currentDate.getDay();
  if (day <= 1) {
    const sundayOffset = day < 1 ? DAY_IN_MILLIS : 0;
    return currentDate - (WEEK_IN_MILLIS - sundayOffset);
  } else {
    return currentDate - (day * DAY_IN_MILLIS);
  }
}

/**
 * Convert Milliseconds to Hours and Mins
 * @param {number} millis 
 */
function convertProjectTimeToHours(projects) {
  Object.entries(projects).forEach(([project, days]) => {
    Object.entries(days).forEach(([day, millis]) => {
      const hours = millis / HOUR_IN_MILLIS;
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
    const diffHrs = Math.floor((diffMilSecs % WEEK_IN_MILLIS) / HOUR_IN_MILLIS); // hours
    const diffMins = Math.round(((diffMilSecs % WEEK_IN_MILLIS) % HOUR_IN_MILLIS) / MIN_IN_MILLIS); // minutes

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

module.exports = {groupEventsById, getPrevMonday};