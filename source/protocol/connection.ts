import WebSocket = require('ws');

import md5 = require('md5');

import { randomBytes } from 'crypto';

import {
  Subject,
  ConnectableObservable,
  Observable
} from 'rxjs';

import { ConnectionState } from './connection-state';
import { Endpoint } from './endpoint'
import { logger } from '../logger';

export interface StateTransition {
  oldState: ConnectionState;
  newState: ConnectionState;
}

export interface Message<T> {
  id: number;
  method?: string;
  params?: T;
  error?: {
    code: number;
    message: string;
  };
}

export interface ResponseHandler {
  <T>(response: Message<T>): void;
}

export abstract class Connection {
  protected state = ConnectionState.Idle;

  private socket: WebSocket;

  private stateStream = new Subject<StateTransition>();

  private packetStream = new Subject<Message<any>>();

  private pending = new Map<number, ResponseHandler>();

  public abstract messages(): Observable<Message<any>>;

  public packets(): Observable<Message<any>> {
    return this.packetStream;
  }

  /// Get a stream of state transition events
  public stateTransition(): Observable<StateTransition> {
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

      this.socket.on('message', (msg: string) => {
        try {
          const json = JSON.parse(msg);
          const {id} = json;

          // Either this is a response to a message we already sent, or it is a new
          // message entirely. The way we handle it depends on which case this message
          // fits into. If it is a response, we will already have a handler waiting for
          // it; otherwise we bubble it up via messageStream.
          if (this.pending.has(id)) {
            this.pending.get(id)(json);
            this.pending.delete(id);
          }
          else {
            this.packetStream.next(json);
          }
        }
        catch (err) {
          this.fail(err.stack);
        }
      });

      this.socket.on('close', () => this.close());
    });
  }

  protected fail(message: string) {
    logger.error(`Closing connection due to error: ${message}`);

    this.transition(ConnectionState.Failed);

    this.close();
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

  private static nextIdentifier = 0;

  public send<TResponse, TRequest>(method: string, params: TRequest = null) {

    logger.debug(`Send: ${method} (${JSON.stringify(params)})`);

    return new Promise<Message<TResponse>>((resolve, reject) => {
      const id = Connection.nextIdentifier++;

      const msg = JSON.stringify({
        id,
        method,
        params,
      });

      this.socket.send(msg, error => {
        if (error) {
          reject(error);
        }
        else {
          this.pending.set(id, response => resolve(response));
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