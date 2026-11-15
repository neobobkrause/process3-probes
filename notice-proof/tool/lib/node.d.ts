// What the reader is told about Node, written for the tool (TypeScript is the only development dependency, so
// Node's own descriptions are not installed). It covers what the made-up product uses; anything else of Node's is
// left undescribed, which the check treats as "cannot tell".

declare module 'node:assert/strict' {
  const assert: NodeAssert;
  export default assert;
}
declare module 'node:assert' {
  const assert: NodeAssert;
  export default assert;
}
interface NodeAssert {
  (value: unknown, message?: string | Error): asserts value;
  ok(value: unknown, message?: string | Error): asserts value;
  equal<T>(actual: unknown, expected: T, message?: string | Error): asserts actual is T;
  strictEqual<T>(actual: unknown, expected: T, message?: string | Error): asserts actual is T;
  notEqual(actual: unknown, expected: unknown, message?: string | Error): void;
  deepEqual<T>(actual: unknown, expected: T, message?: string | Error): asserts actual is T;
  deepStrictEqual<T>(actual: unknown, expected: T, message?: string | Error): asserts actual is T;
  notDeepEqual(actual: unknown, expected: unknown, message?: string | Error): void;
  notStrictEqual(actual: unknown, expected: unknown, message?: string | Error): void;
  notDeepStrictEqual(actual: unknown, expected: unknown, message?: string | Error): void;
  match(value: string, pattern: RegExp, message?: string | Error): void;
  doesNotMatch(value: string, pattern: RegExp, message?: string | Error): void;
  throws(fn: () => unknown, expected?: unknown, message?: string | Error): void;
  doesNotThrow(fn: () => unknown, message?: string | Error): void;
  rejects(fn: Promise<unknown> | (() => Promise<unknown>), expected?: unknown, message?: string | Error): Promise<void>;
  doesNotReject(fn: Promise<unknown> | (() => Promise<unknown>), message?: string | Error): Promise<void>;
  fail(message?: string | Error): never;
}

interface NodeTimer {
  ref(): NodeTimer;
  unref(): NodeTimer;
  hasRef(): boolean;
  refresh(): NodeTimer;
  [Symbol.toPrimitive](): number;
}
declare function setTimeout(callback: (...args: any[]) => void, ms?: number, ...args: any[]): NodeTimer;
declare function clearTimeout(timer?: NodeTimer | number): void;
declare function setInterval(callback: (...args: any[]) => void, ms?: number, ...args: any[]): NodeTimer;
declare function clearInterval(timer?: NodeTimer | number): void;
declare function setImmediate(callback: (...args: any[]) => void, ...args: any[]): unknown;
declare function queueMicrotask(callback: () => void): void;
declare function structuredClone<T>(value: T): T;

interface NodeWritable {
  write(chunk: string, callback?: (error?: Error | null) => void): boolean;
  end(chunk?: string, callback?: () => void): void;
  [key: string]: any;
}
declare var process: {
  stdout: NodeWritable;
  stderr: NodeWritable;
  stdin: any;
  execPath: string;
  argv: string[];
  env: Record<string, string | undefined>;
  exitCode: number | undefined;
  [key: string]: any;
};
declare var console: { log(...a: unknown[]): void; error(...a: unknown[]): void; warn(...a: unknown[]): void; info(...a: unknown[]): void };

declare class URLSearchParams {
  constructor(init?: string | Record<string, string> | [string, string][]);
  get(name: string): string | null;
  getAll(name: string): string[];
  has(name: string): boolean;
  set(name: string, value: string): void;
  append(name: string, value: string): void;
  delete(name: string): void;
  keys(): IterableIterator<string>;
  values(): IterableIterator<string>;
  entries(): IterableIterator<[string, string]>;
  [Symbol.iterator](): IterableIterator<[string, string]>;
  toString(): string;
}
declare class URL {
  constructor(url: string, base?: string | URL);
  href: string;
  origin: string;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  readonly searchParams: URLSearchParams;
  toString(): string;
}
interface ImportMeta { url: string; dirname: string; filename: string; resolve(specifier: string): string; }
declare class TextEncoder { encode(s?: string): Uint8Array; }
declare class TextDecoder { decode(b?: Uint8Array): string; }

declare var crypto: { randomUUID(): string; getRandomValues<T extends ArrayBufferView>(a: T): T };
declare function fetch(input: string | URL, init?: { method?: string; headers?: Record<string, string>; body?: string }): Promise<{ ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> }>;
declare var performance: { now(): number };
