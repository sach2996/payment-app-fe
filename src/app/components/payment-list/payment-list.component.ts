import { Component } from '@angular/core';
import { PaymentService } from '../../core/services/payment.service';
import { Payment } from '../../core/models/payment.model';
import { CommonModule, CurrencyPipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, UpperCasePipe],
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.css'],
})
export class PaymentListComponent {
  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  totalDue: number = 0;
  searchQuery: string = '';
  isLoading: boolean = false; // Add isLoading property
  currentPage: number = 1; // Add current page for pagination
  pageSize: number = 10; // Add page size for pagination
  totalPages: number = 0;

  constructor(private paymentService: PaymentService, private router: Router) {}

  ngOnInit(): void {
    this.getPayments(this.currentPage, this.pageSize);
  } // Remove the initial getPayments() call

  onSearch(): void {
    this.currentPage = 1;
    this.getPayments(this.currentPage, this.pageSize);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.getPayments(this.currentPage, this.pageSize);
  }
  getPayments(currentPage: number, pageNumber: number): void {
    this.isLoading = true; // Set isLoading to true before API call

    this.paymentService
      .getPayments(currentPage, pageNumber, this.searchQuery)
      .subscribe({
        next: (response) => {
          this.payments = response.payments;
          this.filteredPayments = response.payments;
          this.totalPages = response.pagination.total_pages;
          // this.calculateTotalDue();
          this.isLoading = false; // Set isLoading to false after successful API call
        },
        error: (error) => {
          console.error('Error fetching payments:', error);
          // Handle error gracefully (e.g., display an error message to the user)
          this.isLoading = false; // Set isLoading to false in case of error
        },
      });
  }

  deletePayment(id: string) {
    this.isLoading = true;

    this.paymentService.deletePaymentById(id).subscribe({
      next: (response) => {
        this.payments = this.payments.filter((payment) => payment._id !== id);
        this.filteredPayments = this.filteredPayments.filter(
          (payment) => payment._id !== id
        );

        this.totalPages = response.pagination.total_pages;

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error deleting payment:', error);
        this.isLoading = false;
      },
    });
  }

  viewPayment(id: any): void {
    this.router.navigate([`/payments/view/${id}`]);
  }

  onPageChange(pageNumber: number) {
    this.currentPage = pageNumber;
    this.getPayments(this.currentPage, this.pageSize);
  }

  downloadEvidence(evidence_file: string, id: string): void {
    if (!evidence_file) {
      console.error('No evidence file available.');
      return;
    }

    this.isLoading = true;

    this.paymentService.downloadEvidence(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'evidence_file'; // Use the filename or a default one
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error downloading file:', error);
        this.isLoading = false;
      },
    });
  }
}
