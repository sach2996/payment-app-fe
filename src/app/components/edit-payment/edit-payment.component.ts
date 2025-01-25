import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { Payment } from '../../core/models/payment.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-edit-payment',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgIf],
  templateUrl: './edit-payment.component.html',
  styleUrls: ['./edit-payment.component.css'],
})
export class EditPaymentComponent implements OnInit {
  currentDate: string = new Date().toISOString().split('T')[0];
  editing: boolean = false;
  payment: Payment | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  paymentForm!: FormGroup;
  selectedFile: File | null = null;

  paymentStatusOptions: { [key: string]: string } = {
    pending: 'Pending',
    completed: 'Completed',
    due_now: 'Due Now',
    overdue: 'Overdue',
  };
  objectKeys(obj: object): string[] {
    return Object.keys(obj);
  }

  constructor(
    private route: ActivatedRoute,
    private paymentService: PaymentService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchPaymentData();
  }

  fetchPaymentData() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.paymentService.getPaymentById(id).subscribe({
        next: (response) => {
          this.payment = response.payment; // Extract payment object
          if (this.payment) {
            this.createForm(this.payment);
          } else {
            console.error('Payment object is missing in response');
            this.errorMessage = 'Payment data not found';
          }

          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Error loading payment';
          this.isLoading = false;
          console.error('Error fetching payment:', error);
        },
      });
    } else {
      this.errorMessage = 'Invalid payment ID';
      this.isLoading = false;
    }
  }

  createForm(payment: Payment) {
    this.paymentForm = this.fb.group({
      payee_due_date: new FormControl(
        payment.payee_due_date,
        Validators.required
      ),
      due_amount: new FormControl(payment.due_amount, [
        Validators.required,
        Validators.min(0),
      ]),
      payee_payment_status: new FormControl(
        payment.payee_payment_status,
        Validators.required
      ),
      evidence_file: new FormControl(null),
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.paymentForm.patchValue({ evidence_file: file.name }); // Store filename only
    }
  }

  onSubmit() {
    if (this.paymentForm.invalid) {
      return;
    }
    this.editing = false;
    const formData = new FormData();

    Object.keys(this.paymentForm.value).forEach((key) => {
      if (key === 'evidence_file' && this.selectedFile) {
        formData.append('evidence_file', this.selectedFile); // Correct file object
      } else {
        formData.append(key, this.paymentForm.value[key]);
      }
    });

    this.isLoading = true;
    const paymentId = this.route.snapshot.paramMap.get('id');

    if (!paymentId) {
      this.errorMessage = 'Invalid payment ID';
      this.isLoading = false;
      return;
    }

    this.paymentService.updatePayment(paymentId, formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.errorMessage = '';
        this.router.navigate([`/payments/view/${response.body.id}`]);
      },
      error: (err) => {
        alert('Error updating payment!');
        this.errorMessage = err.error.error
          ? err.error.error
          : 'Error updating payment';
        this.isLoading = false;
      },
    });
  }

  cancelUpdate(id: string) {
    this.router.navigate([`/payments/view/${id}`]);
  }

  onDueDateChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement) {
      this.paymentForm.patchValue({ payee_due_date: inputElement.value });
    }
  }

  onDueAmountChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement) {
      this.paymentForm.patchValue({ due_amount: inputElement.value });
    }
  }

  onPaymentStatusChange(event: any) {
    // Update the paymentForm with the new payment status
    this.paymentForm.patchValue({ payee_payment_status: event.target.value });
  }

  downloadEvidence(evidence_file: string, id: string): void {
    if (!evidence_file) {
      console.error('No evidence file available.');
      return;
    }

    this.isLoading = true;

    this.paymentService.downloadEvidence(id).subscribe({
      next: (blob) => {
        // Create a download URL for the blob
        const url = window.URL.createObjectURL(blob);

        // Create a temporary anchor element to trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = 'evidence_file'; // Use the filename or a default one
        document.body.appendChild(a);
        a.click();

        // Clean up
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
