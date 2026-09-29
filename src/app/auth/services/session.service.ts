import { Injectable, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, throwError } from 'rxjs';

import { AuthService, RefreshResponse } from '../../services/auth.service';
import {
  clearSession,
  currentUser,
  getAccessToken,
  hasStoredSession,
  restoreSession,
  tokenExpiry
} from '../utils/auth-state';

// How much life the access token must still have before the refresh fires. Long
// enough that an in-flight request started now cannot outlive the token it was
// signed with, short enough that the refresh cookie is not being spent on every
// navigation.
export const REFRESH_LEEWAY_MS = 60_000;

// Owns the browser session's lifetime: it keeps a valid access token in local
// storage by spending the httpOnly refresh cookie, one request at a time.
//
// It owns state only. Navigation is left to whoever calls it, because the
// bootstrap refresh must fail quietly while a reactive 401 must send the user to
// the login page.
@Injectable({
  providedIn: 'root'
})
export class SessionService {

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // The refresh currently on the wire, shared by every caller. A page load
  // fires several requests at once (the topbar alone fires three), and each of
  // them would otherwise burn the same rotating refresh token.
  private inFlight: Observable<string> | null = null;

  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {

    // Tracking the session signal is what keeps the schedule honest: a rotated
    // token re-arms it with the new expiry, and clearSession() cancels it,
    // with no wiring between this service and the auth utils.
    effect(() => this.armFor(currentUser()?.access_token ?? null));
  }

  // Bootstrap entry point. Resolves once the app is safe to start rendering, so
  // every guard and every first request downstream sees a usable token.
  init(): Observable<unknown> {

    if (getAccessToken()) {
      return of(null);
    }

    // Nothing to rebuild from, or the user deliberately signed out. Spending a
    // refresh call here would be a guaranteed 401.
    if (!hasStoredSession()) {
      return of(null);
    }

    return this.refresh().pipe(catchError(() => of(null)));
  }

  refresh(): Observable<string> {

    if (!this.inFlight) {
      this.inFlight = this.requestRefresh();
    }

    return this.inFlight;
  }

  // The timer callback. A successful refresh needs nothing here: the signal
  // change re-arms the schedule. A rejected one means the refresh cookie is
  // gone too, so the session cannot be recovered and the user has to sign in.
  private refreshNow(): void {
    this.refresh().subscribe({
      next: () => undefined,
      error: () => this.endSession()
    });
  }

  private requestRefresh(): Observable<string> {
    return this.authService.refreshToken().pipe(
      map((response: RefreshResponse) => {
        if (!restoreSession(response.access_token)) {
          throw new Error('Refreshed access token cannot describe this session.');
        }

        return response.access_token;
      }),
      catchError(error => {
        // clearSession before rethrowing, so no caller is left believing it is
        // still signed in.
        clearSession();
        return throwError(() => error);
      }),
      // Above the share so the slot is released once, when the request itself
      // settles, rather than once per subscriber that walked away.
      finalize(() => {
        this.inFlight = null;
      }),
      // HttpClient observables are cold: without this every waiter would fire
      // its own POST. refCount false so a refresh outlives the request that
      // happened to trigger it and still lands the new token.
      shareReplay({ bufferSize: 1, refCount: false })
    );
  }

  private armFor(token: string | null): void {
    this.clearTimer();

    if (!token) {
      return;
    }

    const expiry = tokenExpiry(token);

    if (expiry === null) {
      return;
    }

    const delay = Math.max(0, expiry - Date.now() - REFRESH_LEEWAY_MS);

    this.timer = setTimeout(() => this.refreshNow(), delay);
  }

  private clearTimer(): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  private endSession(): void {
    this.router.navigate(['/login'], {
      queryParams: {
        returnUrl: this.router.url,
        reason: 'session-changed'
      }
    });
  }
}

export function sessionInitFactory(session: SessionService): () => Observable<unknown> {
  return () => session.init();
}
