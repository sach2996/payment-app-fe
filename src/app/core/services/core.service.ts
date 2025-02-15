import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CoreService {
  constructor(private http: HttpClient) {}

  getCountries(): Observable<any> {
    return this.http.get<any>('https://countriesnow.space/api/v0.1/countries');
  }

  getCurrencies(): Observable<any> {
    return this.http.get<any>(
      'https://openexchangerates.org/api/currencies.json'
    );
  }

  getStates(countryCode: string): Observable<any> {
    return this.http.get<any>(
      `https://countriesnow.space/api/v0.1/countries/states`,
      {
        params: { country: countryCode },
      }
    );
  }
}
