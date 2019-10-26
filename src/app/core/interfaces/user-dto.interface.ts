import { User } from './user.interface';

export interface UserCreateInput extends Partial<User> {
  username: string;
  password: string;
}

// tslint:disable-next-line:no-empty-interface
export interface UserUpdateInput extends UserCreateInput { }
