import { Observable, Subject } from 'rxjs';

import { Connection, Message } from '../connection';

export class WebkitConnection extends Connection {
  private messageStream = new Subject<Message<any>>();

  public messages(): Observable<Message<any>> {
    return this.messageStream;
  }

  constructor() {
    super();

    this.packets().subscribe(p => {
      // TODO(cbond): Handle message from server
    })
  }
}
