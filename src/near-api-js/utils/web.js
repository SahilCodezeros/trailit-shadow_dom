import createError from 'http-errors';
import exponentialBackoff from './exponential-backoff';
import { TypedError } from '../providers';

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

const START_WAIT_TIME_MS = 1000;
const BACKOFF_MULTIPLIER = 1.5;
const RETRY_NUMBER = 10;
// TODO: Move into separate module and exclude node-fetch kludge from browser build
let fetch;
if (typeof window === 'undefined' || window.name === 'nodejs') {
    /* eslint-disable @typescript-eslint/no-var-requires */
    const nodeFetch = require('node-fetch');
    const http = require('http');
    const https = require('https');
    /* eslint-enable @typescript-eslint/no-var-requires */
    const httpAgent = new http.Agent({ keepAlive: true });
    const httpsAgent = new https.Agent({ keepAlive: true });
    function agent(_parsedURL) {
        if (_parsedURL.protocol === 'http:') {
            return httpAgent;
        }
        else {
            return httpsAgent;
        }
    }
    fetch = function (resource, init) {
        return nodeFetch(resource, Object.assign({ agent: agent(new URL(resource)) }, init));
    };
}
else {
    fetch = window.fetch;
}
export function fetchJson(connection, json) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = null;
        if (typeof (connection) === 'string') {
            url = connection;
        }
        else {
            url = connection.url;
        }
        const response = yield exponentialBackoff(START_WAIT_TIME_MS, RETRY_NUMBER, BACKOFF_MULTIPLIER, () => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(url, {
                    method: json ? 'POST' : 'GET',
                    body: json ? json : undefined,
                    headers: { 'Content-type': 'application/json; charset=utf-8' }
                });
                if (!response.ok) {
                    if (response.status === 503) {
                        console.warn(`Retrying HTTP request for ${url} as it's not available now`);
                        return null;
                    }
                    throw createError(response.status, yield response.text());
                }
                return response;
            }
            catch (error) {
                if (error.toString().includes('FetchError')) {
                    console.warn(`Retrying HTTP request for ${url} because of error: ${error}`);
                    return null;
                }
                throw error;
            }
        }));
        if (!response) {
            throw new TypedError(`Exceeded ${RETRY_NUMBER} attempts for ${url}.`, 'RetriesExceeded');
        }
        return yield response.json();
    });
}
