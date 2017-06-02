/**
 * This Event Handler is expecting a message with at least those attributes:
 * {
 * 	"timestamp": "2017-05-29T14:53:12Z",
 * 	"id": "deviceId8",
 * 	"status": "online"
 * }
 */

const clientId = 'CHANGE ME';
const clientSecret = 'CHANGE ME';

// require xhr
const XHR = require('xhr');

// require state
const db = require('kvstore');

// require basic auth
const basicAuth = require('codec/auth');

/**
 * Get an access token to access the mnubo's API.
 *
 * A token looks like:
 * {
 *  "access_token": "d78f88gsd8fg8sdf8sdf8sdf8",
 *  "token_type": "Bearer",
 *  "expires_in": 43199,
 *  "scope": "ALL",
 *  "jti": "6d046247-1233-49c8-8888-14fa21e82577"
 * }
 * https://smartobjects.mnubo.com/documentation/api_security.html#getting-your-access-token
 * @param {string} authUri URI to the mnubo OAuth server
 * @param {string} clientId your mnubo's client id
 * @param {string} clientSecret your mnubo's client secret
 */
function fetchAccessToken(authUri, clientId, clientSecret) {
    // eslint-disable-next-line
    console.log('Fetching token from mnubo API');

    const auth = basicAuth.basic(clientId, clientSecret);
    const httpOptions = {
        method: 'POST',
        body: 'grant_type=client_credentials&scope=ALL',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: auth
        },
    };

    return XHR.fetch(authUri, httpOptions).then((x) => {
        const token =  JSON.parse(x.body);
        token.requestedAt = new Date();
        return token;
    });
}

/**
 * Retrieve an access token in the cache (KV store provided by pubnub).
 * If no token is available or if the token is expired, .fetchAccessToken
 * is used to get a new one (it is then stored in the cache).
 *
 * @param {string} authUri URI to the mnubo OAuth server
 * @param {string} clientId your mnubo's client id
 * @param {string} clientSecret your mnubo's client secret
 */
function retrieveAccessToken(authUri, clientId, clientSecret) {
    const fetchAndStoreAccessToken = () => {
        return fetchAccessToken(authUri, clientId, clientSecret).then((newToken) => {
            const expiresInSeconds = newToken.expiresIn * 1000;
            return db.set('token', { value: newToken }, expiresInSeconds).then(() => newToken);
        });
    };

    return db.get('token').then((obj) => {
        const storedToken = obj.value;
        if (storedToken) {
            const now = new Date();
            const requestedAt = new Date(storedToken.requestedAt);
            const expiredTime = requestedAt.getTime() + storedToken.expires_in * 1000;
            const hasExpired = now.getTime() > expiredTime;

            if (hasExpired) {
                return fetchAndStoreAccessToken();
            } else {
                return storedToken;
            }
        } else {
            return fetchAndStoreAccessToken();
        }
    });
}

/**
 * Send events to the mnubo's API
 *
 * An array of event looks like this:
 * [
 *   {
 *       "x_object":{"x_device_id":"vin1234999"},
 *       "x_event_type":"fooevent",
 *       "footimeseries": 34
 *   }
 * ]
 * https://smartobjects.mnubo.com/documentation/api_ingestion.html#post-api-v3-events
 * @param {string} eventsUri URI to the mnubo's Event API
 * @param {object} token token retrieved from the mnubo's API
 * @param {array} events an array of events to send to the mnubo's API
 */
function sendEvents(eventsUri, token, events) {
    // eslint-disable-next-line
    console.log('Sending events to mnubo API');

    const httpOptions = {
        method: 'POST',
        body: JSON.stringify(events),
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token.access_token}`
        },
    };

    return XHR.fetch(eventsUri, httpOptions);
}

function onRequest(request) {
    /**
     * Sandbox: 'https://rest.sandbox.mnubo.com'
     * Production: 'https://rest.api.mnubo.com'
     */
    const baseUri = 'https://rest.sandbox.mnubo.com';

    const authUri = `${baseUri}/oauth/token`;
    const eventsUri = `${baseUri}/api/v3/events`;

    return retrieveAccessToken(authUri, clientId, clientSecret)
        .then((token) => {
            const device = request.message.id;
            const timestamp = request.message.timestamp;
            const status = request.message.status;

            const events = [
                {
                    x_object: { x_device_id: device },
                    x_event_type: 'event_type1',
                    x_timestamp: timestamp,
                    ts_text_attribute: status
                }
            ];

            return sendEvents(eventsUri, token, events);
        }).then(() => {
            return request.ok();
        }).catch((e) => {
            // eslint-disable-next-line
            console.error(e);
            return request.ok();
        });
}

export default onRequest;