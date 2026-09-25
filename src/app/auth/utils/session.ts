export function getToken(): string | null {
  return localStorage.getItem('access_token');
}

export function setToken(token: string): void {
  localStorage.setItem('access_token', token);
}

export function getUserRole(): string | null {
  return localStorage.getItem('role');
}

export function getUsername(): string | null {
  return localStorage.getItem('username');
}

export function clearSession(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('role');
  localStorage.removeItem('username');
  localStorage.removeItem('user_id');
}