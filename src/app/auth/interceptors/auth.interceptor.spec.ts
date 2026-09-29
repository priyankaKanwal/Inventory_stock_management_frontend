import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { clearSession, getAccessToken, startSession } from '../utils/auth-state';

describe('authInterceptor', () => {

  const REFRESH_URL = `${environment.apiUrl}auth/refresh`;
  const ORDERS_URL = `${environment.apiUrl}orders/`;

  let http: HttpClient;
  let httpMock: HttpTestingController;
  let router: { navigate: jasmine.Spy; url: string };

  function makeToken(payload: Record<string, unknown>): string {
    const encode = (value: unknown): string =>
      btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
  }

  function tokenExpiringIn(seconds: number): string {
    return makeToken({
      sub: 'user-1',
      role: 'INVENTORY_MANAGER',
      exp: Math.floor(Date.now() / 1000) + seconds
    });
  }

  function bearer(request: { headers: { get(name: string): string | null } }, token: string): boolean {
    return request.headers.get('Authorization') === `Bearer ${token}`;
  }

  beforeEach(() => {
    localStorage.clear();
    clearSession();

    router = { navigate: jasmine.createSpy('navigate'), url: '/orders' };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    clearSession();
  });

  it('retries a 401 with a freshly refreshed token', () => {
    const stored = tokenExpiringIn(3_600);
    const rotated = tokenExpiringIn(3_600);

    startSession(stored, 'INVENTORY_MANAGER', 'priya');

    let body: unknown = null;
    http.get(ORDERS_URL).subscribe(result => { body = result; });

    const first = httpMock.expectOne(ORDERS_URL);

    expect(bearer(first.request, stored)).toBeTrue();
    first.flush({ detail: 'expired' }, { status: 401, statusText: 'Unauthorized' });

    httpMock.expectOne(REFRESH_URL).flush({ access_token: rotated });

    const replay = httpMock.expectOne(ORDERS_URL);

    expect(bearer(replay.request, rotated)).toBeTrue();

    replay.flush([{ id: 1 }]);

    expect(body).toEqual([{ id: 1 }]);
    expect(getAccessToken()).toBe(rotated);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('keeps the session when the retried request fails for an unrelated reason', () => {
    startSession(tokenExpiringIn(3_600), 'INVENTORY_MANAGER', 'priya');

    const rotated = tokenExpiringIn(3_600);
    const failures: number[] = [];

    http.get(ORDERS_URL).subscribe({
      error: (error: { status: number }) => failures.push(error.status)
    });

    httpMock.expectOne(ORDERS_URL)
      .flush({ detail: 'expired' }, { status: 401, statusText: 'Unauthorized' });

    httpMock.expectOne(REFRESH_URL).flush({ access_token: rotated });

    httpMock.expectOne(ORDERS_URL)
      .flush({ detail: 'server error' }, { status: 500, statusText: 'Server Error' });

    // A 500 from the retry is the request's problem, not the session's, so the
    // token the refresh produced must survive.
    expect(failures).toEqual([500]);
    expect(getAccessToken()).toBe(rotated);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('refreshes once when several requests fail together', () => {
    startSession(tokenExpiringIn(3_600), 'INVENTORY_MANAGER', 'priya');

    const rotated = tokenExpiringIn(3_600);
    const urls = [ORDERS_URL, `${environment.apiUrl}products/`, `${environment.apiUrl}dashboard/stats/`];

    urls.forEach(url => http.get(url).subscribe({ error: () => undefined }));

    urls.forEach(url => httpMock.expectOne(url)
      .flush({ detail: 'expired' }, { status: 401, statusText: 'Unauthorized' }));

    // One refresh for all three, not one each.
    httpMock.expectOne(REFRESH_URL).flush({ access_token: rotated });

    urls.forEach(url => {
      const replay = httpMock.expectOne(url);

      expect(bearer(replay.request, rotated)).toBeTrue();
      replay.flush([]);
    });
  });

  it('ends the session and returns to login when the refresh is rejected', () => {
    startSession(tokenExpiringIn(3_600), 'INVENTORY_MANAGER', 'priya');

    const failures: number[] = [];

    http.get(ORDERS_URL).subscribe({
      error: (error: { status: number }) => failures.push(error.status)
    });

    httpMock.expectOne(ORDERS_URL)
      .flush({ detail: 'expired' }, { status: 401, statusText: 'Unauthorized' });

    httpMock.expectOne(REFRESH_URL)
      .flush({ detail: 'refresh expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(failures).toEqual([401]);
    expect(getAccessToken()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/orders', reason: 'session-changed' }
    });
  });

  it('does not try to refresh a failed call to the refresh endpoint itself', () => {
    http.post(REFRESH_URL, {}).subscribe({ error: () => undefined });

    httpMock.expectOne(REFRESH_URL)
      .flush({ detail: 'expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(httpMock.match(() => true).length).toBe(0);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('sends credentials on the way to login so the refresh cookie travels', () => {
    http.post(`${environment.apiUrl}auth/login`, { username: 'priya' })
      .subscribe({ error: () => undefined });

    const request = httpMock.expectOne(`${environment.apiUrl}auth/login`);

    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.headers.get('Authorization')).toBeNull();

    request.flush({ detail: 'bad password' }, { status: 401, statusText: 'Unauthorized' });

    expect(httpMock.match(() => true).length).toBe(0);
  });
});
