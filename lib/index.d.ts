/// <reference types="node" />
import { EventEmitter } from 'events';
export declare class CloudflareStream {
    readonly credentials: CloudflareCredentials;
    constructor(credentials: CloudflareCredentials);
    upload(uploadOptions: CloudflareUpload): EventEmitter;
}
export interface CloudflareCredentials {
    email: string;
    key: string;
    zone?: string;
}
export interface CloudflareUpload {
    zone?: string;
    buffer?: Buffer;
    path?: string;
}
export default CloudflareStream;
