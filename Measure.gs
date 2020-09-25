var MEASTTYPE_DEF = {
  1: 'Weight (kg)',
  4: 'Height (meter)',
  5: 'Fat Free Mass (kg)',
  6: 'Fat Ratio (%)',
  8: 'Fat Mass Weight (kg)',
  9: 'Diastolic Blood Pressure (mmHg)',
  10: 'Systolic Blood Pressure (mmHg)',
  11: 'Heart Pulse (bpm) - only for BPM and scale devices',
  12: 'Temperature (celsius)',
  54: 'SP02 (%)',
  71: 'Body Temperature (celsius)',
  73: 'Skin Temperature (celsius)',
  76: 'Muscle Mass (kg)',
  77: 'Hydration (kg)',
  88: 'Bone Mass (kg)',
  91: 'Pulse Wave Velocity (m/s)',
  123: 'VO2 max is a numerical measurement of your body’s ability to' +
    'consume oxygen (ml/min/kg).'
}

function height() {
  var types = [4];
  var columns = ['Datetime'];
  types.forEach(function(t) {
    columns.push(MEASTTYPE_DEF[t]);
  });
  var data = getMeas(types, DURATION_HEIGHT);
  if(!data) return;
  fillValues('Height', columns, data, 'yyyy/MM/dd HH:mm:ss');
}

function body() {
  height();
  var types = [1, 6, 76, 77, 88, 11, 91];
  var columns = [
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
  var data = getMeas(types, DURATION_BODY);
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

function fillMeas(types=[1], sheetName='Weight', duration=2592000) {
  var columns = ['Datetime'];
  types.forEach(function(t) {
    columns.push(MEASTTYPE_DEF[t]);
  });
  var data = getMeas(types, duration);
  if(!data) return;
  fillValues(sheetName, columns, data, 'yyyy/MM/dd HH:mm:ss');
}

function getMeas(types=[1], duration=2592000) {
  var url = 'https://wbsapi.withings.net/measure';
  var meastypes = types.join(',')
  var today = new Date() ;
  var enddate = Math.floor(today.getTime() / 1000);
  var startdate = enddate - duration;
  var payload = {
    action: 'getmeas',
    meastypes: meastypes,
    category: 1,
    startdate: startdate,
    enddate: enddate
  }
  var measuregrps = request(url, payload, 'measuregrps');
  var measures = {}
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

  var data = Object.keys(measures).map(function(date) {
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
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName('Height');
  var datetimes = sheet.getRange(2, 1, sheet.getMaxRows()-1).getDisplayValues().flat();
  var heights = sheet.getRange(2, 2, sheet.getMaxRows()-1).getValues().flat();
  var height = null;
  var time = new Date(date).getTime();
  for (var i=datetimes.length-1; i>=0; i--) {
    if (new Date(datetimes[i]).getTime() < time){
      height = heights[i];
      break;
    }
  }
  if (!height) height = heights[0];
  return height;
}
