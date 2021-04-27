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
    // const sundayOffset = day === 0 ? DAY_IN_MILLIS : 0;
    return currentDate - WEEK_IN_MILLIS;
  } else {
    return currentDate - (day * DAY_IN_MILLIS);
  }
}

/**
 * Convert Milliseconds to Hours and Mins
 * @param {number} millis 
 */
function convertProjectTimeToHours(projects) {
  Object.entries(projects).forEach(([project, values]) => {
    Object.entries(values.loggedTimeByWeek).forEach(([day, millis]) => {
      const hours = millis / HOUR_IN_MILLIS;
      const rHours = Math.floor(hours);
      const mins = Math.floor((hours - rHours) * 60);
      projects[project]['loggedTimeByWeek'][day] = `${rHours}:${mins === 0 ? '00' : mins}`;
    });
  });
  return projects;
}

/**
 * Set Logged Time Per project
 * @param {Object} event
 */
 function setLoggedTime(event, project) {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const dayOfTheWeek = days[new Date(event.start).getDay()];
    const diffMilSecs = new Date(event.end) - new Date(event.start);
    const diffHrs = Math.floor((diffMilSecs % WEEK_IN_MILLIS) / HOUR_IN_MILLIS); // hours
    const diffMins = Math.round(((diffMilSecs % WEEK_IN_MILLIS) % HOUR_IN_MILLIS) / MIN_IN_MILLIS); // minutes
    if(project['loggedTimeByWeek'][dayOfTheWeek] === undefined) {
      project['loggedTimeByWeek'][dayOfTheWeek] = diffMilSecs;
    } else {
      project['loggedTimeByWeek'][dayOfTheWeek] += diffMilSecs; 
    }
    project['loggedTimeTotal'] += diffMilSecs;
    return project;
 }

// events - array of objects
// projects - empty object
// eventsNoId - empty object

// output
  // projects
  // - loggedTime
  // - memos
  // - estimatedTime
  // eventsNoId
  // - raw event object (to be converted later)

// loop through events
  // loggedTime
  // memos


/**
 * Loop through Events and Group all events with the same docket id
 * @param {Array<Object>} events 
 */
function groupEventsById(events) {
  let projects = {};
  const eventsNoId = [];
  events.map((event) => {
    const id = event.summary.match(/\d{4}/);
    if (id === null) {
      eventsNoId.push(event);
      return;
    } 
    
    if (projects[id[0]] !== undefined) {
      projects[id[0]] = setLoggedTime(event, projects[id[0]]); 
      projects[id[0]].eventMemos += `, ${event.summary}`;
    } else {
      projects[id[0]] = {
        eventMemos: event.summary,
        loggedTimeByWeek: {},
        loggedTimeTotal: 0,
        forecastedTime: '',
      };
      projects[id[0]] = setLoggedTime(event, projects[id[0]]); 
    }


  });
  projects = convertProjectTimeToHours(projects);
  return {projects, eventsNoId};
}

module.exports = {groupEventsById, getPrevMonday};