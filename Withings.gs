/**
 * Withings API Ref: https://developer.withings.com/oauth2/
 */

const AUTHORIZATION_URL = 'https://account.withings.com/oauth2_user/authorize2';
const TOKEN_URL = 'https://wbsapi.withings.net/v2/oauth2';

/**
 * Authorizes and makes a request to the Withings API.
 */
function request(url, payload, listName) {
  check_service();
  let mainList = getList(url, payload, listName);
  return mainList;
}

/**
 * Check service
 */
function check_service(){
  const service = getService();
  if (!service.hasAccess()) {
    const authorizationUrl = service.getAuthorizationUrl();
    const msg = `
NEED AUTHENTICATION: Google App Script for Withings API.
Open the following URL and re-run the script:
${authorizationUrl}
`
    throwError(msg);
  }
  Logger.log('Service is authorized.')
}

/**
 * Get main list
 */
function getList(url, payload, listName){
  const service = getService();
  const options = {
    headers: {
      Authorization: 'Bearer ' + service.getToken().body.access_token
    },
    payload: payload
  };
  let response = UrlFetchApp.fetch(url, options);
  let result = JSON.parse(response.getContentText());
  if (('status' in result) && result['status'] != 401){
    Logger.log('Try refreshing token.')
    refresh();
    response = UrlFetchApp.fetch(url, options);
    result = JSON.parse(response.getContentText());
  }
  if (!('status' in result) || result['status'] != 0){
    if ('error' in result) throwError('Failed to get list: ' + result['error']);
    throwError('Failed to get list: Unknown error.');
  }
  let mainList = [];
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
function refresh(){
  const service = getService();
  const payload = {
    refresh_token: service.getToken().body.refresh_token,
    client_id: service.clientId_,
    client_secret: service.clientSecret_,
    grant_type: 'refresh_token'
  };
  let token = service.fetchToken_(payload, service.refreshUrl_);
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
  const properties = PropertiesService.getScriptProperties();
  const CLIENT_ID = properties.getProperty("CLIENT_ID");
  const CLIENT_SECRET = properties.getProperty("CLIENT_SECRET");
  if (!CLIENT_ID) throw new Error('Set CLIENT_ID');
  if (!CLIENT_SECRET) throw new Error('Set CLIENT_SECRET');
  return OAuth2.createService('Withings')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl(AUTHORIZATION_URL)
      .setTokenUrl(TOKEN_URL)

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
  const service = getService();
  const authorized = service.handleCallback(request);
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