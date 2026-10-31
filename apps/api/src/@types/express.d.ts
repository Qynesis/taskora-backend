import { AuthenticatedUser } from '@app/shared-types';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: AuthenticatedUser;
    }
  }
}
