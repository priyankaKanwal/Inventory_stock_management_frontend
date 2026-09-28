import { signal } from '@angular/core';

import { isTokenExpired, roleFromToken } from './jwt';
import { AppRole, parseRole } from './role-model';

export { AppRole } from './role-model';

export const STORAGE_KEY = 'stockflow_user_data';

const STORAGE_PREFIX = 'stockflow_';

export interface AuthUser {
  access_token: string;
  username: string;
  // Always derived from the token's role claim, never read back from storage.
  role: AppRole;
  user_id?: string;
}

// Written by the pre-`stockflow_user_data` session shape. Cleared on boot.
const LEGACY_KEYS = ['access_token', 'role', 'username', 'user_id'];

// Removes session keys this app no longer reads, so a hand-made key such as
// `stockflow_access_token` or the old flat keys cannot be mistaken for live
// state. `sidebar_sections` does not match the prefix and is left alone.
function sweepStaleKeys(): void {

  const stale: string[] = [];

  for (let index = 0; index < localStorage.length; index++) {

    const key = localStorage.key(index);

    if (key === null) {
      continue;
    }

    const isStray = key.startsWith(STORAGE_PREFIX) && key !== STORAGE_KEY;
    const isLegacy = (LEGACY_KEYS as string[]).includes(key);

    if (isStray || isLegacy) {
      stale.push(key);
    }
  }

  stale.forEach(key => localStorage.removeItem(key));
}

function writeStoredUser(user: AuthUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function sameStoredUser(a: AuthUser, b: AuthUser): boolean {
  return (
    a.access_token === b.access_token &&
    a.username === b.username &&
    a.role === b.role &&
    a.user_id === b.user_id
  );
}

function readStoredUser(): AuthUser | null {

  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  let parsed: Partial<AuthUser>;

  try {
    parsed = JSON.parse(raw) as Partial<AuthUser>;
  } catch {
    // Corrupted blob: drop it rather than leaving it to fail on every read.
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }

  const accessToken =
    typeof parsed?.access_token === 'string' ? parsed.access_token : '';

  if (!accessToken || isTokenExpired(accessToken)) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }

  // The role comes from the token, so a value edited into the blob is ignored.
  const role = roleFromToken(accessToken);

  if (!role) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }

  const user: AuthUser = {
    access_token: accessToken,
    username: typeof parsed.username === 'string' ? parsed.username : '',
    role
  };

  if (typeof parsed.user_id === 'string') {
    user.user_id = parsed.user_id;
  }

  // Rewrite when the stored mirror disagreed with the token, so a hand-edited
  // role visibly snaps back instead of persisting.
  if (!sameStoredUser(user, parsed as AuthUser)) {
    writeStoredUser(user);
  }

  return user;
}

sweepStaleKeys();

const session = signal<AuthUser | null>(readStoredUser());

// Single source of truth for the signed-in user. A module-level signal rather
// than an injectable service so the route guards and the HTTP interceptor can
// read it synchronously without inject().
export const currentUser = session.asReadonly();

export function startSession(
  accessToken: string,
  responseRole: string | null | undefined,
  username: string,
  userId?: string
): boolean {

  if (!accessToken || isTokenExpired(accessToken)) {
    return false;
  }

  const role = roleFromToken(accessToken);

  if (!role) {
    return false;
  }

  // The response role is informational only. A disagreement means the backend
  // and its own token are inconsistent, which is worth surfacing but should
  // not lock the user out.
  if (parseRole(responseRole) !== role) {
    console.warn(
      '[auth] Login response role does not match the role in the access ' +
      'token. Using the token role.',
      { responseRole, tokenRole: role }
    );
  }

  const user: AuthUser = {
    access_token: accessToken,
    username: username || '',
    role
  };

  if (userId) {
    user.user_id = userId;
  }

  writeStoredUser(user);
  session.set(user);

  return true;
}

// Called by the auth interceptor when the access token is rotated. Returns false
// when the new token is unusable or carries a different role, in which case the
// caller must end the session rather than keep a self-inconsistent one.
export function updateAccessToken(accessToken: string): boolean {

  const user = session();

  if (!user || !accessToken || isTokenExpired(accessToken)) {
    return false;
  }

  const role = roleFromToken(accessToken);

  if (!role || role !== user.role) {
    return false;
  }

  const updated: AuthUser = { ...user, access_token: accessToken };

  writeStoredUser(updated);
  session.set(updated);

  return true;
}

export function getAccessToken(): string | null {
  return session()?.access_token ?? null;
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
  session.set(null);
}
