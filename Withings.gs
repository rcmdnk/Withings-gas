/**
 * Withings API Ref: https://developer.withings.com/oauth2/
 */

/**
 * Authorizes and makes a request to the Withings API.
 */
function request(url, payload, listName) {
  var service = getService();
  if (!service.hasAccess()) {
    var authorizationUrl = service.getAuthorizationUrl();
    var msg = 'Open the following URL and re-run the script: ' +
      authorizationUrl;
    if (typeof EMAIL === 'undefined') {
      var EMAIL = Session.getActiveUser().getEmail();
    }
    if (!EMAIL) throw new Error('Set "EMAIL" if necessary\n\n' + msg); 
    MailApp.sendEmail(EMAIL,
      'NEED AUTHENTICATION: Google App Script for Withings API', msg);
    throw new Error(msg);
  }

  var access_token = service.getToken().body.access_token;
  var mainList = getList(url, payload, listName, access_token);
  if(mainList == 0){
    mainList = getList(url, payload, listName, refresh(service).body.access_token);
  }
  return mainList;
}

/**
 * Get main list
 */
function getList(url, payload, listName, access_token){
  var options = {
    headers: {
      Authorization: 'Bearer ' + access_token
    },
    payload: payload
  };
  var response = UrlFetchApp.fetch(url, options);
  var result = JSON.parse(response.getContentText());
  var mainList = [];
  while(true){
    if (!('status' in result) || result['status'] != 0){
      return 0;
    }
    mainList = mainList.concat(result['body'][listName]);
    if(result['body']['more']){
      options['payload']['offset'] = result['body']['offset'];
      response = UrlFetchApp.fetch(url, options);
      result = JSON.parse(response.getContentText());
      continue;
    }
    break;
  }
  return mainList;
}

/**
 * Refresh token
 */
function refresh(service){
  var payload = {
    refresh_token: service.getToken().body.refresh_token,
    client_id: service.clientId_,
    client_secret: service.clientSecret_,
    grant_type: 'refresh_token'
  };
  var token = service.fetchToken_(payload, service.refreshUrl_);
  service.saveToken_(token);
  return token;
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
  if (typeof CLIENT_ID === 'undefined') throw new Error('Set CLIENT_ID'); 
  if (typeof CLIENT_SECRET === 'undefined') throw new Error('Set CLIENT_SECRET'); 
  return OAuth2.createService('Withings')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl(
          'https://account.withings.com/oauth2_user/authorize2')
      .setTokenUrl('https://wbsapi.withings.net/v2/oauth2')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set scope
      .setScope(SCOPE)

      // Set Token Payload Handler
      .setTokenPayloadHandler(myHandler)

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties());

}

/**
 * TokenPayloadHandler
 */
function myHandler(payload) {
  payload.action = 'requesttoken'; 
  return payload;
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
 * Logs the redirect URI to register.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}