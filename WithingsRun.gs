// Withings API Ref: https://developer.withings.com/oauth2/

var MEASTTYPE_DEF = {
  1: "Weight (kg)",
  4: "Height (meter)",
  5: "Fat Free Mass (kg)",
  6: "Fat Ratio (%)",
  8: "Fat Mass Weight (kg)",
  9: "Diastolic Blood Pressure (mmHg)",
  10: "Systolic Blood Pressure (mmHg)",
  11: "Heart Pulse (bpm) - only for BPM and scale devices",
  12: "Temperature (celsius)",
  54: "SP02 (%)",
  71: "Body Temperature (celsius)",
  73: "Skin Temperature (celsius)",
  76: "Muscle Mass (kg)",
  77: "Hydration (kg)",
  88: "Bone Mass (kg)",
  91: "Pulse Wave Velocity (m/s)",
  123: "VO2 max is a numerical measurement of your body’s ability to consume oxygen (ml/min/kg)."
}

/**
 * Authorizes and makes a request to the Withings API.
 */

function getmeas(meastypes='1', duration=2592000) {
  var service = getService();
  if (service.hasAccess()) {
    var url = 'https://wbsapi.withings.net/measure';
    var date = new Date() ;
    var enddate = Math.floor(date.getTime() / 1000);
    var startdate = enddate - duration;
    var options = {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      },
      payload: {
        action: 'getmeas',
        meastypes: meastypes,
        category: 1,
        startdate: startdate,
        enddate: enddate
      }
    }
    var response = UrlFetchApp.fetch(url, options);
    var result = JSON.parse(response.getContentText());
    if(!result || result['status'] != 0){
      return result ? result['status'] : -1;
    } else {
      measures = {}
      result['body']['measuregrps'].forEach(function(measuregrp) {
        date = measuregrp['date'];
        if (!(date in measures)) {
          measures[date] = {};
        }
        measuregrp['measures'].forEach(function(measure) {
          measures[date][measure['type']] = measure['value'] * (10 ** measure['unit']);
        });                                            
      });
  
      result = Object.keys(measures).map(function(key) {
        return [Number(key), measures[key]];
      });
      result.sort(function(x, y) {
        return x[0] - y[0];
      });
    }
    return result; 
  } else {
    var authorizationUrl = service.getAuthorizationUrl();
    function errorReport(body) {
      MailApp.sendEmail(EMAIL, "Custom script error report", body);
    }
    Logger.log('Open the following URL and re-run the script: %s',
        authorizationUrl);
    return null;
  }
}

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

function height() {
  var result = getmeas('4', DURATION_HEIGHT);
  if(!result) return;
  var sheet = getSheet('Height', ['Datetime', MEASTTYPE_DEF[4]]);
  var row = sheet.getDataRange().getValues().length + 1;
  var lastrow = sheet.getLastRow();
  var datetimes = sheet.getRange('A:A').getValues().flat().filter(Number);
  var data = [];
  result.forEach(function(measure) {
    if (datetimes.includes(measure[0])) return;
    data.push([measure[0], measure[1][4]]);
  });
  if (data.length) {
    sheet.getRange(row, data.length, 1, 2).setValues(data);
  }                                        
}

function run() {
  var service = getService();
  if (service.hasAccess()) {
    var url = 'https://wbsapi.withings.net/measure';

    var date = new Date() ;
    var enddate = Math.floor(date.getTime() / 1000);
    var startdate = enddate - 60 * 60 * 24 * DAYS;
    var options = {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      },
      payload: {
        action: 'getmeas',
        meastypes: '1,5,6,8,11,76,77,88',
        category: 1,
        startdate: startdate,
        enddate: enddate
      }
    }
    var response = UrlFetchApp.fetch(url, options);
    var result = JSON.parse(response.getContentText());
    //Logger.log(JSON.stringify(result, null, 2));
    
    var ss = SpreadsheetApp.getActive();
    Logger.log(ss);
    var sheet = ss.getSheetByName('Measure');
    if (!sheet) {
      sheet = ss.insertSheet('Measure');
      sheet.getRange(1, 1).setValue('Datetime');
      sheet.getRange(1, 2).setValue('FatRatio');
      sheet.getRange(1, 3).setValue('Hydration');
      sheet.getRange(1, 4).setValue('BoneMass');
      sheet.getRange(1, 5).setValue('MuscleMass');

      sheet.getDataRange().getValues().length + 1
    }
    Logger.log(sheet.getName());  
  } else {
    var authorizationUrl = service.getAuthorizationUrl();
    function errorReport(body) {
      MailApp.sendEmail(EMAIL, "Custom script error report", body);
    }
    Logger.log('Open the following URL and re-run the script: %s',
        authorizationUrl);
  }
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
      .setAuthorizationBaseUrl('https://account.withings.com/oauth2_user/authorize2')
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