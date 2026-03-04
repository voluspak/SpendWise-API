import { UserRole } from '../../../common/enums/index.js';

export class JwtPayload {
  sub!: string;
  email!: string;
  role!: UserRole;
}
