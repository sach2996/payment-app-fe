import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Payment } from '../models/payment.model';
import { environment } from '../../../environments/environment';

const apiUrl = environment.apiUrl;

type PaymentKeys =
  | 'payee_due_date'
  | 'payee_last_name'
  | 'payee_payment_status'
  | 'evidence_file';
@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  constructor(private http: HttpClient) {}

  getPayments(
    page: number = 1,
    limit: number = 10,
    searchQuery: string
  ): Observable<any> {
    const queryParams = new HttpParams()
      .set('search', searchQuery)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http
      .get<any>(`${apiUrl}`, { params: queryParams })
      .pipe(map((response) => response));
  }
  getPaymentById(id: string): Observable<{ payment: Payment }> {
    return this.http.get<{ payment: Payment }>(`${apiUrl}/${id}`);
  }

  deletePaymentById(id: string): Observable<any> {
    return this.http.delete<any>(`${apiUrl}/${id}`);
  }

  createPayment(paymentData: Payment): Observable<any> {
    return this.http.post<any>(apiUrl, paymentData);
  }

  updatePayment(id: string, paymentData: FormData): Observable<any> {
    return this.http.patch<any>(`${apiUrl}/${id}`, paymentData, {
      reportProgress: true,
      observe: 'response',
    });
  }

  downloadEvidence(id: string): Observable<Blob> {
    return this.http.get(`${apiUrl}/${id}/download_evidence`, {
      responseType: 'blob', // Important: Specify the response type as a blob
    });
  }
}
