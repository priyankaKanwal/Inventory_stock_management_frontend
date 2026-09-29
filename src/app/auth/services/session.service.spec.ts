import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { REFRESH_LEEWAY_MS, SessionService } from './session.service';
import { SESSION_META_KEY, clearSession, getAccessToken, startSession } from '../utils/auth-state';

describe('SessionService', () => {

  const REFRESH_URL = `${environment.apiUrl}auth/refresh`;

  let httpMock: HttpTestingController;
  let router: { navigate: jasmine.Spy; url: string };

  function makeToken(payload: Record<string, unknown>): string {
    const encode = (value: unknown): string =>
      btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
  }

  function tokenExpiringIn(seconds: number, role = 'INVENTORY_MANAGER'): string {
    return makeToken({
      sub: 'user-1',
      role,
      exp: Math.floor(Date.now() / 1000) + seconds
    });
  }

  // The state a reload leaves behind when the access token expired: no session,
  // but a mirror, and a refresh cookie this app cannot see.
  function simulateExpiredBoot(username = 'priya'): void {
    clearSession();
    localStorage.setItem(
      SESSION_META_KEY,
      JSON.stringify({ username, role: 'INVENTORY_MANAGER' })
    );
  }

  // A live session leaves a refresh scheduled, and fakeAsync refuses to end a
  // test with timers pending. Logging out tears the schedule down, and the
  // zero-delay re-arm that follows finds no token to refresh.
  function endSession(): void {
    clearSession();
    TestBed.flushEffects();
    tick(0);
  }

  beforeEach(() => {
    localStorage.clear();
    clearSession();

    router = { navigate: jasmine.createSpy('navigate'), url: '/orders' };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    clearSession();
  });

  it('refreshes before the access token expires, then re-arms', fakeAsync(() => {
    startSession(tokenExpiringIn(90), 'INVENTORY_MANAGER', 'priya');

    const session = TestBed.inject(SessionService);
    TestBed.flushEffects();

    // The token is good for 90s, so the refresh lands 60s before the end.
    tick(29_000);
    httpMock.expectNone(REFRESH_URL);

    tick(1_000);

    const request = httpMock.expectOne(REFRESH_URL);

    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBeTrue();

    const rotated = tokenExpiringIn(3_600);
    request.flush({ access_token: rotated });

    expect(getAccessToken()).toBe(rotated);

    // The signal change re-arms the schedule against the new expiry, so the
    // next refresh is another leeway before the new token runs out.
    TestBed.flushEffects();
    tick(3_600_000 - REFRESH_LEEWAY_MS - 1_000);
    httpMock.expectNone(REFRESH_URL);

    tick(1_000);
    httpMock.expectOne(REFRESH_URL).flush({ access_token: tokenExpiringIn(3_600) });

    endSession();
  }));

  it('spends one refresh no matter how many callers ask at once', fakeAsync(() => {
    startSession(tokenExpiringIn(3_600), 'INVENTORY_MANAGER', 'priya');

    const session = TestBed.inject(SessionService);
    const tokens: string[] = [];

    session.refresh().subscribe(token => tokens.push(token));
    session.refresh().subscribe(token => tokens.push(token));
    session.refresh().subscribe(token => tokens.push(token));

    const rotated = tokenExpiringIn(3_600);
    httpMock.expectOne(REFRESH_URL).flush({ access_token: rotated });

    expect(tokens).toEqual([rotated, rotated, rotated]);

    endSession();
  }));

  it('ends the session and returns to login when a scheduled refresh is rejected', fakeAsync(() => {
    startSession(tokenExpiringIn(REFRESH_LEEWAY_MS / 1000 + 1), 'INVENTORY_MANAGER', 'priya');

    const session = TestBed.inject(SessionService);
    TestBed.flushEffects();

    tick(1_000);
    httpMock.expectOne(REFRESH_URL)
      .flush({ detail: 'expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(getAccessToken()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/orders', reason: 'session-changed' }
    });

    // One rejection must not leave the schedule running against a dead session.
    tick(60_000);
    httpMock.expectNone(REFRESH_URL);
  }));

  it('does not touch the API at boot when the token is still valid', fakeAsync(() => {
    startSession(tokenExpiringIn(3_600), 'INVENTORY_MANAGER', 'priya');

    const session = TestBed.inject(SessionService);
    let resolved = false;

    session.init().subscribe(() => { resolved = true; });

    httpMock.expectNone(REFRESH_URL);
    expect(resolved).toBeTrue();

    endSession();
  }));

  it('does not call the API at boot for a first-time visitor', fakeAsync(() => {
    const session = TestBed.inject(SessionService);
    let resolved = false;

    session.init().subscribe(() => { resolved = true; });

    httpMock.expectNone(REFRESH_URL);
    expect(resolved).toBeTrue();
  }));

  it('rebuilds an expired session from the refresh cookie at boot', fakeAsync(() => {
    simulateExpiredBoot();

    const session = TestBed.inject(SessionService);
    let resolved = false;

    session.init().subscribe(() => { resolved = true; });

    const rotated = tokenExpiringIn(3_600);
    httpMock.expectOne(REFRESH_URL).flush({ access_token: rotated });

    expect(resolved).toBeTrue();
    expect(getAccessToken()).toBe(rotated);

    endSession();
  }));

  it('boots quietly when the refresh cookie is gone', fakeAsync(() => {
    simulateExpiredBoot();

    const session = TestBed.inject(SessionService);
    let resolved = false;
    let failed = false;

    session.init().subscribe({
      next: () => { resolved = true; },
      error: () => { failed = true; }
    });

    httpMock.expectOne(REFRESH_URL)
      .flush({ detail: 'expired' }, { status: 401, statusText: 'Unauthorized' });

    // The session is already gone, so the guard bounces to /login on its own.
    expect(resolved).toBeTrue();
    expect(failed).toBeFalse();
    expect(getAccessToken()).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();

    tick(60_000);
    httpMock.expectNone(REFRESH_URL);
  }));

  it('refuses a refreshed token that no longer describes the same session', fakeAsync(() => {
    startSession(tokenExpiringIn(3_600), 'INVENTORY_MANAGER', 'priya');

    const session = TestBed.inject(SessionService);
    let failed = false;

    session.refresh().subscribe({ error: () => { failed = true; } });

    httpMock.expectOne(REFRESH_URL)
      .flush({ access_token: tokenExpiringIn(3_600, 'SUPER_ADMIN') });

    expect(failed).toBeTrue();
    expect(getAccessToken()).toBeNull();

    endSession();
  }));
});
