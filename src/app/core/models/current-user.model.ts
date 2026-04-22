export type PlatformRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  platformRole: PlatformRole;
  phoneNumber: string | null;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
}