import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();

    // Attach to request for downstream usage (pino-http picks this up via req.id)
    req.id = requestId;
    // Set on response header for client-side tracing
    res.setHeader('X-Request-Id', requestId);

    next();
  }
}
