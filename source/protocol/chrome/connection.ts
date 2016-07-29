import { Subject, Observable } from 'rxjs';

import { logger } from '../../logger';
import { Connection, Message } from '../connection';
import { ConnectionState } from '../connection-state';
import { Debugger } from '../debugger';

export type Message = any;

export class ChromeConnection extends Connection {
  private messageStream = new Subject<Message<any>>();

  public messages(): Observable<Message<any>> {
    return this.messageStream;
  }

  constructor() {
    super();

    this.packets().subscribe(message => {
      if (message.error != null) {
        logger.error(`Received error from debugger instance: ${message.error.message}`);

        this.transition(ConnectionState.Failed);

        this.close();
      } else {
        this.messageStream.next(message);
      }
    })
  }

  protected start(): Promise<Debugger> {
    const controller = this.getDebugger();

    const all = Promise.all([
      this.send<any, any>('Debugger.enable'),
      this.send<any, any>('Console.enable')
    ]);

    return all.then(() => {
      this.transition(ConnectionState.Debugging);

      return controller;
    });
  }

  protected getDebugger() {
    const connection = this;

    const Class = class ChromeDebugger extends Debugger {
      constructor() {
        super();

        connection.messages().subscribe(m => {
          switch (m.method) {
            case 'Console.messageAdded':
              const {message} = m.params;

              this.consoleStream.next({
                text: message.text,
                url: message.url,
                sourcePosition: [message.line, message.column],
                timestamp: new Date(message.timestamp),
              });
              break;
            default:
              break;
          }
        });
      }
    }

    return new Class();
  }
}