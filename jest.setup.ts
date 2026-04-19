// Polyfills for Web APIs not available in jsdom
import { TextEncoder, TextDecoder } from "util";

if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = TextEncoder;
}
if (!globalThis.TextDecoder) {
  globalThis.TextDecoder = TextDecoder as any;
}
if (!globalThis.fetch) {
  globalThis.fetch = jest.fn();
}
if (typeof ReadableStream === "undefined") {
  globalThis.ReadableStream = class ReadableStream {
    private _chunks: Uint8Array[] = [];
    private _done = false;
    private _underlyingSource: any;

    constructor(underlyingSource: any) {
      this._underlyingSource = underlyingSource;
      if (underlyingSource?.start) {
        underlyingSource.start(this._controller);
      }
    }

    private _controller = {
      enqueue: (chunk: Uint8Array) => {
        this._chunks.push(chunk);
      },
      close: () => {
        this._done = true;
      },
      error: (e: Error) => {
        throw e;
      },
    };

    getReader() {
      return {
        read: async () => {
          if (this._underlyingSource?.pull) {
            await this._underlyingSource.pull(this._controller);
          }
          if (this._chunks.length > 0) {
            return { done: false, value: this._chunks.shift()! };
          }
          return { done: true, value: undefined };
        },
        cancel: async () => {},
      };
    }
  } as any;
}
