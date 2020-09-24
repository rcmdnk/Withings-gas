/**
 * Withings API Ref: https://developer.withings.com/oauth2/
 */
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

/**
 * Authorizes and makes a request to the Withings API.
 */
function request(url, payload) {
  var service = getService();
  if (!service.hasAccess()) {
    var authorizationUrl = service.getAuthorizationUrl();
    var msg = 'Open the following URL and re-run the script: ' +
      authorizationUrl;
    MailApp.sendEmail(EMAIL, 'ERROR: Google App Script for Withings API', msg);
    throw new Error(msg);
    return null;
  }
  var options = {
    headers: {
      Authorization: 'Bearer ' + service.getAccessToken()
    },
    payload: payload
  }
  var response = UrlFetchApp.fetch(url, options);
  var result = JSON.parse(response.getContentText());
  if (!('status' in result) || result['status'] != 0){
    throw new Error('Withings API returns wrong status: \n' + result);
  }
  return result;
}

/**
 * Get measures
 */
function getMeas(meastypes='1', duration=2592000) {
  var url = 'https://wbsapi.withings.net/measure';
  var date = new Date() ;
  var enddate = Math.floor(date.getTime() / 1000);
  var startdate = enddate - duration;
  var payload = {
    action: 'getmeas',
    meastypes: meastypes,
    category: 1,
    startdate: startdate,
    enddate: enddate
  }
  var result = request(url, payload);
  measures = {}
  result['body']['measuregrps'].forEach(function(measuregrp) {
    date = measuregrp['date'];
    if (!(date in measures)) {
      measures[date] = {};
    }
    measuregrp['measures'].forEach(function(measure) {
      measures[date][measure['type']] = measure['value'] * (
          10 ** measure['unit']);
    });
  });

  result = Object.keys(measures).map(function(key) {
    return [Number(key), measures[key]];
  });
  result.sort(function(x, y) {
    return x[0] - y[0];
  });

  return result;
}

/**
 * Fill measures to Spreadsheet
 */

function getSheet(name, cols=[]) {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.deleteRows(2, sheet.getMaxRows()-1);
    var nCols = cols ? cols.length: 1;
    sheet.deleteColumns(2, sheet.getMaxColumns()-1);
    cols.forEach(function(c, i) {
      sheet.getRange(1, i+1).setValue(c);
    });
  }
  return sheet;
}

function fillMeas(types=[1], sheetName='Weight', duration=2592000) {
  var result = getMeas(types.join(','), duration);
  if(!result) return;
  var columns = ['Datetime'];
  types.forEach(function(t) {
    columns.push(MEASTTYPE_DEF[t]);
  });
  var sheet = getSheet(sheetName, columns);
  var datetimes = sheet.getRange('A:A').getValues().flat().filter(Number);
  var data = [];
  result.forEach(function(measure) {
    if (datetimes.includes(measure[0])) return;
    var data_one = [measure[0]];
    types.forEach(function(t) {
      data_one.push(measure[1][t]);
    });
    data.push(data_one);
  });
  if (data.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1,
        data.length, columns.length).setValues(data);
  }
}

function height() {
  fillMeas([4], 'Height', DURATION_HEIGHT);
}

function body() {
  fillMeas([1, 5, 6, 8 ,11, 76, 77, 88], 'Body', DURATION_BODY);
}

/**
 * Reset the authorization state, so that it can be re-tested.
 */
function reset() {
  getService().reset();
}

/**
 * Configures the service.
 */
function getService() {
  return OAuth2.createService('Withings')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl(
          'https://account.withings.com/oauth2_user/authorize2')
      .setTokenUrl('https://account.withings.com/oauth2/token')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set scope
      .setScope('user.metrics')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties());
}

/**
 * Handles the OAuth callback.
 */
function authCallback(request) {
  var service = getService();
  var authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied.');
  }
}

/**
 * Logs the redict URI to register.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}
