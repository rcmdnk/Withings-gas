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
  var options = {
    headers: {
      Authorization: 'Bearer ' + service.getAccessToken()
    },
    payload: payload
  };
  var response = UrlFetchApp.fetch(url, options);
  var result = JSON.parse(response.getContentText());
  var mainList = [];
  while(true){
    if (!('status' in result) || result['status'] != 0){
      throw new Error('Withings API returns wrong status: \n' + response);
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
      .setTokenUrl('https://account.withings.com/oauth2/token')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set scope
      .setScope(SCOPE)

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
 * Logs the redirect URI to register.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}