import { createConnection, Socket } from 'net';
import { Transform } from 'stream';
import { Subject, Observable } from 'rxjs';

import { logger } from '../../logger';
import { Connection } from '../connection';
import { ConnectionState } from '../connection-state';
import { HttpParser } from '../http/parser';

export type Message = any;

export class ChromeConnection extends Connection {
  protected transform: Transform;

  protected messageStream = new Subject<Message>();

  public get messages(): Observable<Message> {
    return this.messageStream;
  }

  constructor() {
    super();

    const httpParser = new HttpParser();

    this.packets.subscribe(packet => {
      httpParser.write(packet,
        transformed => {
          const {code, headers, content} = transformed;

          if (code !== 200) {
            this.transition(ConnectionState.Failed);
          }
          else {
            this.messageStream.next(transformed);
          }
        });
    });
  }

  protected receive(packet: Buffer) {
    console.log('Receive', packet);
  }
}

//     return new Promise<void>((resolve, reject) => {

//         that.socket = Net.createConnection(port, url),
//         that.socket.setEncoding('utf8');

//         setTimeout(() => {
//             reject('Connection timed out')
//         }, timeout);

//         that.socket.on('error', reject);

//         that.socket.on('connect', function() {
//             // Replace the promise-rejecting handler
//             that.socket.removeListener('error', reject);

//             that.socket.on('error', e => {
//                 console.error('socket error: ' + e.toString());

//                 if (e.code == 'ECONNREFUSED') {
//                     e.helpString = 'Is node running with --debug port ' + port + '?';
//                 } else if (e.code == 'ECONNRESET') {
//                     e.helpString = 'Check there is no other debugger client attached to port ' + port + '.';
//                 }

//                 that.lastError = e.toString();
//                 if (e.helpString) {
//                     that.lastError += '. ' + e.helpString;
//                 }

//                 that.emit('error', e);
//             });

//             });

//             that.socket.on('data', function(data) {
//                 that.debugBuffer += data;
//                 that.parse(function() {
//                      that.connected = true;
//                      that.emit('connect');
//                      resolve();
//                 });
//             });


//             that.socket.on('end', function() {
//                 that.close();
//             });

//             that.socket.on('close', function() {
//                 if (!that.connected)
//                 {
//                     reject("Can't connect. Check the application is running on the device");
//                     that.emit('close', that.lastError || 'Debugged process exited.');
//                     return;
//                 }
//                 that.connected = false;
//                 that.emit('close', that.lastError || 'Debugged process exited.');
//             });
//         });
// }

// private makeMessage() {
//     return {
//         headersDone: false,
//         headers: null,
//         contentLength: 0
//     };
// }

// private parse(connectedCallback: () => any) {
//     var b, obj;
//     var that = this;
//     if (this.msg && this.msg.headersDone) {
//         //parse body
//         if (Buffer.byteLength(this.debugBuffer) >= this.msg.contentLength) {
//             b = new Buffer(this.debugBuffer);
//             this.msg.body = b.toString('utf8', 0, this.msg.contentLength);
//             this.debugBuffer = b.toString('utf8', this.msg.contentLength, b.length);
//             if (this.msg.body.length > 0) {
//                 obj = JSON.parse(this.msg.body);
//                 Logger.log('From target(' + (obj.type ? obj.type : '') + '): ' + this.msg.body);
//                 if (typeof obj.running === 'boolean') {
//                     this.isRunning = obj.running;
//                 }
//                 if (obj.type === 'response' && obj.request_seq > 0) {
//                     this.callbacks.processResponse(obj.request_seq, [obj]);
//                 }
//                 else if (obj.type === 'event') {
//                     if (obj.event === "afterCompile") {
//                         if (!that.connected && connectedCallback) {
//                             connectedCallback();
//                         }
//                     }

//                     this.emit(obj.event, obj);
//                 }
//             }
//             this.msg = false;
//             this.parse(connectedCallback);
//         }
//         return;
//     }

//     if (!this.msg) {
//         this.msg = this.makeMessage();
//     }

//     this.offset = this.debugBuffer.indexOf('\r\n\r\n');
//     if (this.offset > 0) {
//         this.msg.headersDone = true;
//         this.msg.headers = this.debugBuffer.substr(0, this.offset + 4);
//         this.contentLengthMatch = /Content-Length: (\d+)/.exec(this.msg.headers);
//         if (this.contentLengthMatch[1]) {
//             this.msg.contentLength = parseInt(this.contentLengthMatch[1], 10);
//         }
//         else {
//             console.warn('no Content-Length');
//         }
//         this.debugBuffer = this.debugBuffer.slice(this.offset + 4);
//         this.parse(connectedCallback);
//     }
// }

// public send(data) {
//     if (this.connected) {
//         Logger.log('To target: ' + data);
//         this.socket.write('Content-Length: ' + data.length + '\r\n\r\n' + data);
//     }
// }

// public request(command, params, callback) {
//     var msg = {
//         seq: 0,
//         type: 'request',
//         command: command
//     };

//     if (typeof callback == 'function') {
//         msg.seq = this.callbacks.wrap(callback);
//     }

//     if (params) {
//         Object.keys(params).forEach(function(key) {
//             msg[key] = params[key];
//         });
//     }
//     this.send(JSON.stringify(msg));
// }

// public close() {
//     if (this.socket) {
//         this.socket.end();
//     }
// }