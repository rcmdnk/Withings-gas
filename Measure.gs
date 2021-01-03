var MEASTTYPE_DEF = {
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
  //var measuregrps = request(url, payload, 'measuregrps');
  Logger.log(OAUTH2_CLIENT_ID);
  let api_util = new APIUtil('withings', OAUTH2_BASE_URL, OAUTH2_TOKEN_URL, OAUTH2_CLIENT_ID, OAUTH2_CLIENT_SECRET,
                                     OAUTH2_SCOPE, undefined, undefined, 'https://wbsapi.withings.net/measure', OAUTH2_HEADERS);
  Logger.log(api_util.client_id);
  let result = api_util.json();
  var measuregrps = [];
  while(true){
    if (!('status' in result) || result['status'] != 0){
      throw new Error('Withings API returns wrong status: \n' + result);
    }
    measuregrps = measuregrps.concat(result['body'][listName]);
    if(result['body']['more']){
      let headers = JSON.parse(JSON.stringify(OAUTH2_HEADERS));
      headers['payload']['offset'] = result['body']['offset'];
      api_util.headers = headers;
      result = api_util.json();
      continue;
    }
    break;
  }
  
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
  var datetimes = sheet.getRange(
      2, 1, sheet.getMaxRows()-1).getDisplayValues().flat();
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


class APIUtil {
  constructor(name='MyService', base_url=undefined, token_url=undefined,
              client_id=undefined, client_secret=undefined, scope=undefined, params={},
              token=undefined, url=undefined, headers={}) {
    this.name = name;
    this.vars = {base_url: base_url, token_url: token_url, client_id: client_id, client_secret: client_secret}
    this.scope = scope;
    this.params = params;
    this.token = token;
    this.url = url;
    this.headers=headers;
  }
  
  get base_url() { return this.vars.base_url; }
  get token_url() { return this.vars.token_url; }
  get client_id() { return this.vars.client_id; }
  get client_secret() { return this.vars.client_secret; }
  set base_url(base_url) { this.vars.base_url = base_url; }
  set token_url(token_url) { this.vars.token_url = token_url; }
  set client_id(base_url) { this.vars.client_id = client_id; }
  set client_secret(client_secret) { this.vars.client_secret = client_secret; }
  
  get service() { 
    const vars = this.vars;
    Object.keys(vars).forEach(function(key){
      if(!vars[key])throw new Error('Set ' + key);
    });
　  let service = OAuth2.createService(this.name)
 　     .setAuthorizationBaseUrl(this.vars.base_url)
 　     .setTokenUrl(this.vars.token_url)  
  　    .setClientId(this.vars.client_id)
 　     .setClientSecret(this.vars.client_secret)
  　    .setCallbackFunction('authCallback')
  　    .setPropertyStore(PropertiesService.getUserProperties())
    if(this.scope) service = service.setScope(this.scope);
    if(this.params){
 　    Object.keys(this.params).forEach(function(key){
 　      service = service.setParam(key, this[key]);
      });
    }
    return service;
  }
  
  getToken() {
    if(this.token)return this.token;
    const service = this.service;
    if (!service.hasAccess()) {
      throw new Error('Open the following URL and re-run the script: '
                      + service.getAuthorizationUrl());
    }
    return service.getAccessToken();
  }

  reset() {
    this.getService().reset();
　}

  authCallback(request) {
    const service = this.getService();
    const authorized = service.handleCallback(request);
    if (authorized) {
      return HtmlService.createHtmlOutput('Success!');
    } else {
      return HtmlService.createHtmlOutput('Denied.');
    }
  }

  logRedirectUri() {
    Logger.log(OAuth2.getRedirectUri());
  }
  
  fetch (url=undefined) {
    url = url || this.url;
    let headers = this.headers;
    headers['Authorization'] = 'Bearer ' + this.getToken();
    return UrlFetchApp.fetch(url, {
      headers: headers
    });                                       
  }
  
  contentText (url=undefined) {
    return this.fetch(url).getContentText();
  }
  
  json (url=undefined) {
    return JSON.parse(this.contentText(url));
  }                 
}