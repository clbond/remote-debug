import { Buffer } from 'buffer';

export enum State {
  Headers,
  Content,
};

export class HttpParser {
  protected buffer: string;

  protected state = State.Headers;

  protected headers: Map<string, any>;

  public write(chunk: Buffer, callback: (transformed) => void) {
    const stringValue = chunk.toString('utf8');

    if (this.buffer != null) {
      this.buffer += stringValue;
    } else {
      this.buffer = stringValue;
    }

    switch (this.state) {
      case State.Headers:
        const headers = this.parseHeaders();
        if (headers) {
          this.headers = headers;
          this.state = State.Content;
          break;
        }
        break;
      case State.Content:
        break;
      default:
        throw new Error(`Unknown HTTP parser state: ${State[this.state]}`);
    }

    if (this.state === State.Content) {
      const contentLength = this.contentLength;

      console.log('Content-Length', contentLength);
      console.log('buffer size', this.buffer.length);

      if (this.buffer.length >= contentLength) {
        callback({
          code: this.headers['@status-code'],
          headers: this.headers,
          content: this.parseContent(contentLength)
        });

        this.resetState(contentLength);
      }
    }
  }

  protected get contentLength(): number {
    if (this.headers == null) {
      throw new Error('No HTTP headers set');
    }

    const key = 'Content-Length';

    if (this.headers.has(key) === false) {
      throw new Error(`HTTP header set does not contain Content-Length`);
    }

    return parseInt(this.headers.get(key), 10);
  }

  protected parseHeaders(): Map<string, string> {
    const eol = '\r\n';

    const index = this.buffer.indexOf(eol.repeat(2));
    if (index < 0) {
      return null;
    }

    // We have received the complete set of headers; therefore we can splice them
    // from the buffer and return a map containing the actual headers. We need to
    // make sure when this function finishes that none of the header data is inside
    // of the buffer.
    const headerChunk = this.buffer.slice(0, index);

    // Split the header string into a key-value map for each header-value pair.
    const map = new Map<string, string>();

    const headers = headerChunk.split(eol);

    // The first line of the headers is the status code, eg HTTP/1.1 404 Not Found
    const { code, text } = this.getStatus(headers[0]);

    map.set('@status-code', code);
    map.set('@status-text', text);

    headers.slice(1).forEach(header => {
      const [key, value] = header.split(': ');

      if (value == null) {
        throw new Error(`HTTP header has no value: ${key}`);
      }

      map.set(key, value);
    });

    // Reset the buffer so that it points to the beginning of the body.
    this.buffer = this.buffer.slice(index + eol.length * 2);

    return map;
  }

  protected parseContent(size: number) {
    const key = 'Content-Type';

    if (this.headers.has(key) === false) {
      throw new Error('HTTP response has no Content-Type header');
    }

    const contentType = this.headers.get(key);

    if (/^application\/json/.test(contentType) === false) {
      throw new Error(`Expecting JSON content, received ${contentType}`);
    }

    console.log('Parse: [', this.buffer.slice(0, size), ']');

    const result = JSON.parse(this.buffer.slice(0, size));

    console.log('Result: ', result);

    return result;
  }

  protected resetState(consumed: number) {
    if (this.buffer.length > consumed) {
      this.buffer = this.buffer.slice(consumed);
    }
    else {
      this.buffer = null;
    }

    this.state = State.Headers;
  }

  protected getStatus(status: string) {
    const regex = /^HTTP\/([\d\.]+) (\d+) (.*)$/;

    const match = status.match(regex);
    if (match == null) {
      throw new Error(`Cannot parse HTTP status line: ${status}`);
    }

    return {
      code: match[2],
      text: match[3]
    };
  }
}