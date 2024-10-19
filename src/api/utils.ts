export class ServerError extends Error {
  statusCode: number;
  constructor(message: string, code: number) {
    super(message);
    this.statusCode = code;
  }
}

export default function throwServerError(message: string, code: number) {
  const err = new ServerError(message, code);
  throw err;
}
