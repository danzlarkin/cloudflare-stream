import * as tus from 'tus-js-client';
import * as https from 'https';
import { EventEmitter } from 'events';
import { readFileSync } from 'fs';
import { parse } from 'url';

export class CloudflareStream {

  constructor(readonly credentials: CloudflareCredentials) {
  }

  upload(uploadOptions: CloudflareUpload) {
    // Create an event emitter to be the response object
    const event = new EventEmitter;

    // Determine where we are loading the file from
    let file;
    if (uploadOptions.path) {
      file = readFileSync(uploadOptions.path);
    } else if (uploadOptions.buffer) {
      file = uploadOptions.buffer;
    } else {
      throw(`You must set either a 'path' or 'buffer' in the upload method's options.`);
    }

    // Determine whether a zone has been set somewhere or not
    let zone;
    if (uploadOptions.zone) {
      zone = uploadOptions.zone;
    } else if (this.credentials.zone) {
      zone = this.credentials.zone;
    } else {
      throw(`You must set a 'zone' in either the constructor or in the upload method's options.`);
    }

    // Define the header credentials
    const headers = {
      'X-Auth-Email': this.credentials.email,
      'X-Auth-Key': this.credentials.key,
    }

    // Attemp to perform an upload to the cloudflare api, and bind event emitters
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
        // Make a request to the cloudflare media endpoint and return the payload
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

// Basic require functionality for returning data on the media
const request = (url: string, headers = {}) => new Promise((resolve, reject) => {
  const parsed = parse(url);
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
      if (dataJSON.errors.length > 0) reject(dataJSON.errors);
      resolve(dataJSON);
    });
  }).on('error', (error) => {
    reject(error);
  });
});

// Perform basic formatting where possible
const formatError = (error) => {
  if (error.originalRequest.status == 403) {
    return {
      message: 'Invalid Cloudflare Credentials'
    }
  }
  if (error.originalRequest.responseText != '') {
    return {
      message: error.originalRequest.responseText
    }
  }
  if (typeof error == 'string') {
    return {
      message: error
    }
  }
  return error;
}

export interface CloudflareCredentials {
  email: string,
  key: string,
  zone?: string
}

export interface CloudflareUpload {
  zone?: string,
  buffer?: Buffer,
  path?: string,
}

export default CloudflareStream;