function sleepTest() {
  var today = new Date() ;
  var enddate = Math.floor(today.getTime() / 1000);
  var startdate = enddate - duration;
  sleep(startdate, enddate);
}

function sleepSummary() {
  var fields = ['breathing_disturbances_intensity', 'deepsleepduration',
      'durationtosleep', 'durationtosleep', 'durationtowakeup', 'hr_average',
      'hr_max', 'hr_min', 'lightsleepduration', 'remsleepduration',
      'rr_average', 'rr_max', 'rr_min', 'sleep_score', 'snoring',
      'snoringepisodecount', 'wakeupcount', 'wakeupduration'];
  var dateInfo = ['date',  'timezone', 'startdate', 'enddate'];
  var columns = dateInfo.concat();
  fields.forEach(function(f) {
    columns.push(f);
  });
  var data = getSleepSummary(fields, dateInfo, DURATION_SLEEP_SUMMARY);
  if(!data) return;
  fillValues('SleepSummary', columns, data, 'yyyy-MM-dd');
}

function sleep(startdate, enddate) {
  var fields = ['hr', 'rr', 'snoring'];
  var columns = ['datetime'];
  fields.forEach(function(f) {
    columns.push(f);
  });
  var data = getSleep(fields, startdate, enddate);
  if(!data) return;
  fillValues('Sleep', columns, data, 'yyyy/MM/dd HH:mm:ss');
}

function getSleep(fields, duration=2592000) {
  var url = 'https://wbsapi.withings.net/v2/sleep';
  var payload = {
    action: 'get',
    data_fields: fields.join(','),
    startdate: startdate,
    enddate: enddate
  }
  var series = request(url, payload, 'series');
  var sleep = {};
  series.forEach(function(s) {
    fields.forEach(function(f) {
      if (!(f in s)) return;
      for (var date in s[f]) {
        if (!(date in sleep)) sleep[date] = {};
        sleep[date][f] = s[f][date];
      }
    });
  });
  
  var data = Object.keys(sleep).map(function(date) {
    return [getDate(date)].concat(
      fields.map(function(f) {
        return sleep[date][f];
      })
    );
  });
  return data;
}

function getSleepSummary(fields, dateInfo, duration=2592000) {
  var url = 'https://wbsapi.withings.net/v2/sleep';
  var today = new Date();
  var enddate = Math.floor(today.getTime() / 1000);
  var startdate = enddate - duration;
  var payload = {
    action: 'getsummary',
    lastupdate: startdate,
    data_fields: fields.join(',')
  }
  var series = request(url, payload, 'series');
  var data = series.map(function(s) {
    var oneData = dateInfo.map(function(i) {
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