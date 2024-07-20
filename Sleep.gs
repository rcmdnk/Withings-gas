
function sleepTest() {
  const today = new Date() ;
  const enddate = Math.floor(today.getTime() / 1000);
  const startdate = enddate - 60 * 60 * 24;
  sleep(startdate, enddate);
}

function sleep(startdate, enddate) {
  const fields = ['hr', 'rr', 'snoring'];
  const columns = ['datetime'];
  fields.forEach(function(f) {
    columns.push(f);
  });
  const data = getSleep(fields, startdate, enddate);
  if(!data) return;
  fillValues('Sleep', columns, data, 'yyyy/MM/dd HH:mm:ss');
}

function getSleep(fields, startdate, enddate) {
  const url = 'https://wbsapi.withings.net/v2/sleep';
  const payload = {
    action: 'get',
    data_fields: fields.join(','),
    startdate: startdate,
    enddate: enddate
  }
  const series = request(url, payload, 'series');
  const sleep = {};
  series.forEach(function(s) {
    fields.forEach(function(f) {
      if (!(f in s)) return;
      for (var date in s[f]) {
        if (!(date in sleep)) sleep[date] = {};
        sleep[date][f] = s[f][date];
      }
    });
  });
  
  const data = Object.keys(sleep).map(function(date) {
    return [getDate(date)].concat(
      fields.map(function(f) {
        return sleep[date][f];
      })
    );
  });
  return data;
}

function sleepSummary() {
  const fields = ['breathing_disturbances_intensity', 'deepsleepduration',
      'durationtosleep', 'durationtowakeup', 'hr_average',
      'hr_max', 'hr_min', 'lightsleepduration', 'remsleepduration',
      'rr_average', 'rr_max', 'rr_min', 'sleep_score', 'snoring',
      'snoringepisodecount', 'wakeupcount', 'wakeupduration'];
  const dateInfo = ['date',  'timezone', 'startdate', 'enddate'];
  const data = getSleepSummary(fields, dateInfo, DURATION_SLEEP_SUMMARY);
  if(!data) return;
  const columns = dateInfo.concat(fields);
  const sheet = fillValues('SleepSummary', columns, data, 'yyyy-MM-dd');
  columns.forEach(function(c, i) {
    if (c == 'startdate' || c == 'enddate') {
      const charCode = 'A'.charCodeAt(0) + i;
      cost character = String.fromCharCode(charCode);
      sheet.getRange(`${character}:${character}`).setNumberFormat('yyyy-MM-dd HH:mm:ss');
    }
  });
}

function getSleepSummary(fields, dateInfo, duration=2592000) {
  const url = 'https://wbsapi.withings.net/v2/sleep';
  const today = new Date();
  const enddate = Math.floor(today.getTime() / 1000);
  const startdate = enddate - duration;
  const payload = {
    action: 'getsummary',
    lastupdate: startdate,
    data_fields: fields.join(',')
  }
  const series = request(url, payload, 'series');
  const data = series.map(function(s) {
    const oneData = dateInfo.map(function(i) {
      if (['startdate', 'enddate'].includes(i)) {
        return getDate(s[i]);
      }
      return s[i];
    });
    return oneData.concat(
      fields.map(function(f) {
        return s['data'][f]
      })
    );
  });
  return data;
}