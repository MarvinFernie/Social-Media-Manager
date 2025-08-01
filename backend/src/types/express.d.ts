import { User as UserModel } from '../models/User';

declare global {
  namespace Express {
    interface User extends UserModel {}
    interface Request {
      user?: UserModel;
    }
  }
}

export {};

