import { AppRole, parseRole } from './role-model';

// Decoding only, never signature verification: the browser has no signing key
// and could not meaningfully hold one. These helpers bind the role we store to
// the role the backend issued inside the token, which is what makes a role
// hand-edited in devtools inert. Authenticity of the token itself is the
// backend's job, on every request.

export function decodeJwtPayload(
  token: string
): Record<string, unknown> | null {

  if (!token) {
    return null;
  }

  const segments = token.split('.');

  if (segments.length !== 3) {
    return null;
  }

  const encoded = segments[1];

  if (!encoded) {
    return null;
  }

  try {

    // base64url -> base64, then pad to a multiple of 4
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));

    const json = new TextDecoder().decode(bytes);
    const payload = JSON.parse(json) as unknown;

    if (typeof payload !== 'object' || payload === null) {
      return null;
    }

    return payload as Record<string, unknown>;

  } catch {
    // Not a decodable JWT. Treated the same as no token at all.
    return null;
  }
}

// The role the backend signed into the token, or null when the token carries
// no role the frontend recognises.
export function roleFromToken(token: string): AppRole | null {

  const payload = decodeJwtPayload(token);

  if (!payload) {
    return null;
  }

  const claim = payload['role'];

  return parseRole(typeof claim === 'string' ? claim : null);
}

// A missing exp is treated as expired so a hand-written token is never trusted.
export function isTokenExpired(token: string): boolean {

  const payload = decodeJwtPayload(token);

  if (!payload) {
    return true;
  }

  const exp = payload['exp'];

  if (typeof exp !== 'number' || !Number.isFinite(exp)) {
    return true;
  }

  return Date.now() >= exp * 1000;
}
