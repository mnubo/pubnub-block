/**
 * This Event Handler is expecting a message with at least those attributes:
 * {
 * 	"id": "deviceId5"
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
 * Check if an object exists on the mnubo's platform
 *
 * https://smartobjects.mnubo.com/documentation/api_ingestion.html#get-api-v3-objects-exists-x-device-id
 * @param {string} objectsUri URI to the mnubo's Object API
 * @param {object} token token retrieved from the mnubo's API
 * @param {string} deviceId the device unique identifier
 */
function checkObjectExistence(objectsUri, token, deviceId) {
    // eslint-disable-next-line
    console.log('Checking if object exists on mnubo');

    const existsUri = `${objectsUri}/exists/${deviceId}`;
    const httpOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token.access_token}`
        },
    };

    return XHR.fetch(existsUri, httpOptions).then((resp) => {
        const body = JSON.parse(resp.body);
        return body[deviceId];
    });
}

/**
 * Create a new object on the mnubo's platform
 *
 * https://smartobjects.mnubo.com/documentation/api_ingestion.html#post-api-v3-objects
 * @param {string} objectsUri URI to the mnubo's Object API
 * @param {object} token token retrieved from the mnubo's API
 * @param {object} object object to create on the mnubo's platform
 */
function createObject(objectsUri, token, object) {
    // eslint-disable-next-line
    console.log('Creating object on mnubo');

    const httpOptions = {
        method: 'POST',
        body: JSON.stringify(object),
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token.access_token}`
        },
    };

    return XHR.fetch(objectsUri, httpOptions);
}

function onRequest(request) {
    /**
     * Sandbox: 'https://rest.sandbox.mnubo.com'
     * Production: 'https://rest.api.mnubo.com'
     */
    const baseUri = 'https://rest.sandbox.mnubo.com';

    const authUri = `${baseUri}/oauth/token`;
    const objectsUri = `${baseUri}/api/v3/objects`;

    return retrieveAccessToken(authUri, clientId, clientSecret)
        .then((token) => {
            const device = request.message.id;
            return checkObjectExistence(objectsUri, token, device).then((exists) => {
                if (!exists) {
                    const newObject = {
                        x_device_id: device,
                        x_object_type: 'object_type1',
                        object_text_attribute: 'an object text attribute defined in the model'
                    };
                    return createObject(objectsUri, token, newObject);
                }
            });
        }).then(() => {
            return request.ok();
        }).catch((e) => {
            // eslint-disable-next-line
            console.error(e);
            return request.ok();
        });
}

export default onRequest;