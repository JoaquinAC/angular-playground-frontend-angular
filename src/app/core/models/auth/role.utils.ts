import { AppRole } from './auth.models';

type BackendRole = 'ADMIN' | 'GUEST' | 'ROLE_ADMIN' | 'ROLE_GUEST';

export function normalizeRole(role: string | undefined | null): AppRole {
  const normalized = (role || '').toUpperCase() as BackendRole | '';

  if (normalized === 'ADMIN' || normalized === 'ROLE_ADMIN') return 'admin';
  return 'guest';
}