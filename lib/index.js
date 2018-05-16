"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tus = require("tus-js-client");
const https = require("https");
const events_1 = require("events");
const fs_1 = require("fs");
const url_1 = require("url");
class CloudflareStream {
    constructor(credentials) {
        this.credentials = credentials;
    }
    upload(uploadOptions) {
        const event = new events_1.EventEmitter;
        let file;
        if (uploadOptions.path) {
            file = fs_1.readFileSync(uploadOptions.path);
        }
        else if (uploadOptions.buffer) {
            file = uploadOptions.buffer;
        }
        else {
            throw (`You must set either a 'path' or 'buffer' in the upload method's options.`);
        }
        let zone;
        if (uploadOptions.zone) {
            zone = uploadOptions.zone;
        }
        else if (this.credentials.zone) {
            zone = this.credentials.zone;
        }
        else {
            throw (`You must set a 'zone' in either the constructor or in the upload method's options.`);
        }
        const headers = {
            'X-Auth-Email': this.credentials.email,
            'X-Auth-Key': this.credentials.key,
        };
        const upload = new tus.Upload(file, {
            endpoint: `https://api.cloudflare.com/client/v4/zones/${zone}/media`,
            chunkSize: 5242880,
            headers: headers,
            onError(error) {
                event.emit('error', formatError(error));
            },
            onProgress(uploadedBytes, totalBytes) {
                event.emit('progress', {
                    uploaded: uploadedBytes,
                    total: totalBytes,
                    percentage: (uploadedBytes / totalBytes).toFixed(2)
                });
            },
            onSuccess() {
                request(upload.url, headers).then(response => {
                    event.emit('success', response);
                }).catch(error => {
                    event.emit('error', formatError(error));
                });
            }
        });
        upload.start();
        return event;
    }
}
exports.CloudflareStream = CloudflareStream;
const request = (url, headers = {}) => new Promise((resolve, reject) => {
    const parsed = url_1.parse(url);
    https.get({
        protocol: parsed.protocol,
        host: parsed.host,
        port: 443,
        path: parsed.pathname,
        headers: headers,
    }, (response) => {
        let data = '';
        response.on('data', (d) => {
            data += d;
        });
        response.on('end', () => {
            const dataJSON = JSON.parse(data);
            if (dataJSON.errors.length > 0)
                reject(dataJSON.errors);
            resolve(dataJSON);
        });
    }).on('error', (error) => {
        reject(error);
    });
});
const formatError = (error) => {
    if (error.originalRequest.status == 403) {
        return {
            message: 'Invalid Cloudflare Credentials'
        };
    }
    if (error.originalRequest.responseText != '') {
        return {
            message: error.originalRequest.responseText
        };
    }
    if (typeof error == 'string') {
        return {
            message: error
        };
    }
    return error;
};
exports.default = CloudflareStream;
//# sourceMappingURL=index.js.map