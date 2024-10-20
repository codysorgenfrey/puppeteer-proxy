import { Request } from 'express';

export class ServerError extends Error {
  statusCode: number;
  constructor(message: string, code: number) {
    super(message);
    this.statusCode = code;
  }
}

export function throwServerError(message: string, code: number) {
  const err = new ServerError(message, code);
  throw err;
}

export function isAuthenticated(req: Request): boolean {
  if (!req.query.key) throwServerError('Missing api key', 401);
  if (!process.env.API_KEY)
    throwServerError('Missing api key environment variable', 500);
  return req.query.key === process.env.API_KEY;
}
