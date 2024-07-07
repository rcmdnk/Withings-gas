const MEASTTYPE_DEF = {
  1: 'Weight (kg)',
  4: 'Height (meter)',
  5: 'Fat Free Mass (kg)',
  6: 'Fat Ratio (%)',
  8: 'Fat Mass Weight (kg)',
  9: 'Diastolic Blood Pressure (mmHg)',
  10: 'Systolic Blood Pressure (mmHg)',
  11: 'Heart Pulse (bpm)',
  12: 'Temperature (celsius)',
  54: 'SP02 (%)',
  71: 'Body Temperature (celsius)',
  73: 'Skin Temperature (celsius)',
  76: 'Muscle Mass (kg)',
  77: 'Hydration (kg)',
  88: 'Bone Mass (kg)',
  91: 'Pulse Wave Velocity (m/s)',
  123: 'VO2 max (ml/min/kg).'
}

function height() {
  const types = [4];
  const columns = ['Datetime'];
  types.forEach(function(t) {
    columns.push(MEASTTYPE_DEF[t]);
  });
  const data = getMeas(types, DURATION_HEIGHT);
  if(!data) return;
  fillValues('Height', columns, data, 'yyyy/MM/dd HH:mm:ss');
}

function body() {
  height();
  const types = [1, 6, 76, 77, 88, 11, 91];
  const columns = [
    'Datetime',
    MEASTTYPE_DEF[1],
    MEASTTYPE_DEF[6],
    'BMI',
    'Muscle Ratio (%)',
    'Hydration Ratio (%)',
    'Bone Ratio (%)',
    MEASTTYPE_DEF[11],
    MEASTTYPE_DEF[91]
  ];
  let data = getMeas(types, DURATION_BODY);
  if(!data) return;
  data = data.map(function(d) {
    return [
      d[0],
      d[1],
      d[2],
      d[1]/(getHeight(d[0])**2),
      d[3] ? d[3]/d[1] * 100 : null,
      d[4] ? d[4]/d[1] * 100 : null,
      d[5] ? d[5]/d[1] * 100 : null,
      d[6],
      d[7]
    ];
  });
  fillValues('Body', columns, data, 'yyyy/MM/dd HH:mm:ss');
}

function getMeas(types=[1], duration=2592000) {
  const url = 'https://wbsapi.withings.net/measure';
  const meastypes = types.join(',')
  const today = new Date() ;
  const enddate = Math.floor(today.getTime() / 1000);
  const startdate = enddate - duration;
  const payload = {
    action: 'getmeas',
    meastypes: meastypes,
    category: 1,
    startdate: startdate,
    enddate: enddate
  }
  const measuregrps = request(url, payload, 'measuregrps');
  const measures = {}
  measuregrps.forEach(function(measuregrp) {
    var date = measuregrp['date'];
    if (!(date in measures)) {
      measures[date] = {};
    }
    measuregrp['measures'].forEach(function(measure) {
      measures[date][measure['type']] = measure['value'] * (
          10 ** measure['unit']);
    });
  });

  const data = Object.keys(measures).map(function(date) {
    return [getDate(date)].concat(
      types.map(function(t) {
        return measures[date][t];
      })
    )});
  // sort at sheet
  //data.sort(function(x, y) {
  //  return x[0] - y[0];
  //});

  return data;
}

function getHeight(date) {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName('Height');
  const datetimes = sheet.getRange(
      2, 1, sheet.getMaxRows()-1).getDisplayValues().flat();
  const heights = sheet.getRange(2, 2, sheet.getMaxRows()-1).getValues().flat();
  let height = null;
  const time = new Date(date).getTime();
  for (var i=datetimes.length-1; i>=0; i--) {
    if (new Date(datetimes[i]).getTime() < time){
      height = heights[i];
      break;
    }
  }
  if (!height) height = heights[0];
  return height;
}
