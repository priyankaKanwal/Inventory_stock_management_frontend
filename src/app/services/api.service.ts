import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, EMPTY } from 'rxjs';
import { expand, reduce } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';

// Uniform paginated response envelope returned by all list endpoints.
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {

  protected readonly baseUrl = environment.apiUrl;

  constructor(protected http: HttpClient) {}

  protected buildUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  // Fetch every page of a paginated list endpoint and return the
  // concatenated items (used for reference data such as dropdowns,
  // table name lookups, and per-record access gating).
  protected fetchAll<T>(
    requestPage: (page: number, pageSize: number) => Observable<Paginated<T>>,
    pageSize = 100
  ): Observable<T[]> {
    return requestPage(1, pageSize).pipe(
      expand((response) =>
        response.page < response.total_pages
          ? requestPage(response.page + 1, pageSize)
          : EMPTY
      ),
      reduce<Paginated<T>, T[]>(
        (all, response) => all.concat(response.items),
        []
      )
    );
  }
}