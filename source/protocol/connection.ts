import WebSocket from 'ws';

import { Subject, Observable } from 'rxjs';

import { ConnectionState } from './connection-state';
import { Endpoint } from './endpoint'
import { logger } from '../logger';

export interface StateTransition {
  oldState: ConnectionState;
  newState: ConnectionState;
}

export class Connection {
  protected state = ConnectionState.Idle;

  protected socket: WebSocket;

  protected stateStream = new Subject<StateTransition>();

  protected packetStream = new Subject<Buffer>();

  protected get packets(): Observable<Buffer> {
    return this.packetStream;
  }

  /// Get a stream of state transition events
  public get stateTransition(): Observable<StateTransition> {
    return this.stateStream;
  }

  public connect(endpoint: Endpoint): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      logger.debug(`Connecting to ${endpoint.debuggerUri}`);

      this.socket = new WebSocket(endpoint.debuggerUri);

      this.socket.on('open', () => {
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

      this.socket.on('message', (buffer: Buffer) => {
        logger.debug(`Received packet of ${buffer.length} bytes`);

        this.packetStream.next(buffer);
      });

      this.socket.on('close', () => this.close());
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

  public send<T>(content: T): Promise<void> {
    console.log('Send: ', content);

    return new Promise<void>((resolve, reject) => {
      this.socket.send(content, error => {
        if (error) {
          reject(error);
        }
        else {
          resolve();
        }
      });
    });
  }

  public close = () => {
    if (this.socket == null) {
      return;
    }

    switch (this.state) {
      case ConnectionState.Idle:
      case ConnectionState.Failed: // do not transition from failed state on close
        break;
      default:
        this.transition(ConnectionState.Idle);
        break;
    }

    this.socket.close();
    this.socket = null;
  }
}