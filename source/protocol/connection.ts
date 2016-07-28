import { createConnection, Socket } from 'net';

import { Subject, Observable } from 'rxjs';

import { ConnectionState } from './connection-state';

import { logger } from '../logger';

export interface StateTransition {
  oldState: ConnectionState;
  newState: ConnectionState;
}

export class Connection {
  protected state = ConnectionState.Idle;

  protected socket: Socket;

  protected stateStream = new Subject<StateTransition>();

  protected packetStream = new Subject<Buffer>();

  protected get packets(): Observable<Buffer> {
    return this.packetStream;
  }

  /// Get a stream of state transition events
  public get stateTransition(): Observable<StateTransition> {
    return this.stateStream;
  }

  public connect(host: string, port: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      logger.debug(`Connecting to ${host}:${port}`);

      this.socket = createConnection(port, host, () => {
        this.transition(ConnectionState.Connected);

        resolve();
      });

      this.socket.on('error', error => {
        this.transition(ConnectionState.Failed);

        switch (this.state) {
          case ConnectionState.Connecting:
            reject(error);
            break;
          default:
            break;
        }
      });

      this.socket.on('data', (buffer: Buffer) => {
        logger.debug(`Received packet of ${buffer.length} bytes`);

        this.packetStream.next(buffer);
      });

      this.socket.on('close', (failure: boolean) => {
        if (failure) {
          this.transition(ConnectionState.Failed);
        }

        this.close();
      });
    });
  }

  protected transition(newState: ConnectionState): ConnectionState {
    const oldState = this.state;

    if (newState === oldState) {
      return oldState;
    }

    logger.debug('Connection state transition: ' +
      `${ConnectionState[oldState]} -> ${ConnectionState[newState]}`);

    switch (newState) {
      case ConnectionState.Failed:
      case ConnectionState.Idle:
        this.close();
        break;
    }

    this.stateStream.next({
      oldState,
      newState,
    });

    return oldState;
  }

  public send(content: string): Promise<void> {
    console.log('Send: ', content);

    return new Promise<void>(resolve => {
      this.socket.write(content, 'utf8', resolve);
    });
  }

  public get(path: string, headers) {
    const request = [
      `GET ${path} HTTP/1.1`,
    ].concat(Object.keys(headers).map(h => `${h}: ${headers[h]}`))

    this.send(request.join('\r\n') + '\r\n\r\n');
  }

  public close = () => {
    if (this.socket == null) {
      return;
    }

    switch (this.state) {
      case ConnectionState.Idle:
      case ConnectionState.Failed:
        break;
      default:
        this.transition(ConnectionState.Idle);
        break;
    }

    this.socket.destroy();
    this.socket = null;
  }
}