export interface Logger {
  log(msg: string): void;
  warn(msg: string): void;
  error(msg: string, ...args: unknown[]): void;
}
