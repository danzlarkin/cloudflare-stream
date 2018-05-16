# Cloudflare Stream

A minimalistic node.js package for easily uploading videos to [Cloudflare Stream](https://developers.cloudflare.com/stream/).

## Getting Started

Let's start off by installing the package via NPM.

```sh
npm i cloudflare-stream
```

Once you've done that, you're going to want to create an instance of a [CloudflareStream](#CloudflareStream) with your [credentials](#credentials).

```js
import { CloudflareStream } from 'cloudflare-stream';

const uploader = new CloudflareStream({
  email: 'sam@example.com', // cloudflare email address
  key: 'c23864bc3ada9bf9c937810f62bb69a4e90b0' // cloudflare api key
});
```

Now that you've made an instance, you're going to want to upload your video to your zone.
Let's create an [upload](#uploaduploadOptions) with your [upload options](#uploadOptions).

```js
const upload = uploader.upload({
  zone: 'ca4239cdd6a52cec1e916a6cd0e2f629', // cloudflare zone id
  path: './videos/demo-video.mp4' // path to video on filesystem
});
```

The [upload](#uploaduploadOptions) method returns an [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter) which has three events ([progress](#uploadEventprogressmessage), [success](#uploadEventsuccessmessage), [error](#uploadEventerrormessage)).

Let's create some logs from your [upload events](#Upload_Events).

```js
upload.on('progress', (progress) => {
  console.log(`${progress.precentage} of upload completed (${progress.uploaded} bytes / ${progress.total} bytes)`);
});

upload.on('error', (error) => {
  console.log('An error has occurred', error);
});

upload.on('success', (response) => {
  console.log(response);
});
```


## API Documentation

### CloudflareStream
```ts
class CloudflareStream {

  constructor(credentials: CloudflareCredentials);

  upload(uploadOptions: CloudflareUpload);

}
```

#### constructor(credentials)

##### credentials

```ts
type CloudflareCredentials {
  email,
  key,
  zone?
}
```

##### credentials.email

An ```email``` is always required, it should be the email address which you use to sign in with Cloudflare.

##### credentials.key

A ```key``` is always required, it should be the [API Key](https://support.cloudflare.com/hc/en-us/articles/200167836-Where-do-I-find-my-Cloudflare-API-key-
) which matches the email address which you use to sign in with Cloudflare.

##### credentials.zone

If a ```zone``` is not set in the ```uploadOptions``` of an instance method, then a ```zone``` is required in the ```credentials```.

A ```zone``` must be a valid [Cloudflare DNS Zone](https://www.cloudflare.com/learning/dns/glossary/dns-zone/) which is accessable using the specified email address and API key.


#### upload(uploadOptions)

Returns an [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter) with three events ([progress](#uploadEventprogressmessage), [success](#uploadEventsuccessmessage), [error](#uploadEventerrormessage)).

##### uploadOptions
```ts
type CloudflareUpload {
  zone?,
  path?,
  buffer?
}
```

##### uploadOptions.zone

If a ```zone``` has not been set in the constructor, then a ```zone``` is required in the ```uploadOptions```.

A ```zone``` must be a valid [Cloudflare DNS Zone](https://www.cloudflare.com/learning/dns/glossary/dns-zone/) which is accessable using the specified email address and API key.

If a ```zone``` has already been set in the constructor, this value will overwrite it.

##### uploadOptions.path
If a ```buffer``` has not been set in the ```uploadOptions```, then a ```path``` is required.

A ```path``` must be a string pointing to a video file on the local filesystem. 

It can be either an absolute path or a path relative to the node.js process (```process.cwd()```).

##### uploadOptions.zone

If a ```path``` has not been set in the ```uploadOptions```, then a ```buffer``` is required.

A ```buffer``` must be a valid node.js [Buffer](https://nodejs.org/api/buffer.html#buffer_class_buffer).


#### Upload Events

##### uploadEvent.progress(message)

Emitted when a chunk has been successfully uploaded.

Example output:

```js
{
  uploaded: 23592,
  total: 65536,
  percentage: 35.99
}
```

##### uploadEvent.success(message)

Emitted when the upload has successfully completed.

Example output:
```js
{
  "result": {
    "uid": "dd5d531a12de0c724bd1275a3b2bc9c6",
    "thumbnail": "https://cloudflarestream.com/dd5d531a12de0c724bd1275a3b2bc9c6/thumbnails/thumb.png",
    "readyToStream": false,
    "status": {
      "state": "inprogress",
      "step": "encoding",
      "pctComplete": "78.18"
    },
    "meta": {},
    "labels": [],
    "created": "2018-01-01T01:00:00.474936Z",
    "modified": "2018-01-01T01:02:21.076571Z",
    "size": 62335189,
    "preview": "https://watch.cloudflarestream.com/dd5d531a12de0c724bd1275a3b2bc9c6"
  },
  "success": true,
  "errors": [],
  "messages": []
}
```

##### uploadEvent.error(message)

Emitted whenever an error has occured.

Example output:

```js
{
  message: 'Invalid Cloudflare Credentials'
}
```


