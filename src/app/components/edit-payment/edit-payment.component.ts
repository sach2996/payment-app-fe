import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { Payment } from '../../core/models/payment.model';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { LocalTimePipe } from '../../core/pipes/localtime.pipe';

@Component({
  selector: 'app-edit-payment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    LocalTimePipe,
  ],
  templateUrl: './edit-payment.component.html',
  styleUrls: ['./edit-payment.component.css'],
})
export class EditPaymentComponent implements OnInit {
  payment: Payment | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  paymentForm!: FormGroup;
  selectedFile: File | null = null;

  paymentStatuses = ['pending', 'due_now', 'completed'];

  constructor(
    private route: ActivatedRoute,
    private paymentService: PaymentService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.paymentService.getPaymentById(id).subscribe({
        next: (response) => {
          console.log('API Response:', response); // Debugging log
          this.payment = response.payment; // Extract payment object

          if (this.payment) {
            this.createForm(this.payment);
            const utcDate = this.paymentForm.get('payee_added_date_utc')?.value;
            if (utcDate) {
              const localDate = new Date(utcDate).toLocaleString(); // Convert to local time
              this.paymentForm.patchValue({ payee_added_date_utc: localDate });
            }
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
    if (payment && payment.currency) {
      console.log('Currency:', payment.currency);
    } else {
      console.log('Payment object or currency is not defined yet:', payment);
    }
    this.paymentForm = this.fb.group({
      payee_first_name: new FormControl({
        value: payment.payee_first_name,
        disabled: true,
      }),
      payee_last_name: new FormControl({
        value: payment.payee_last_name,
        disabled: true,
      }),
      payee_added_date_utc: new FormControl({
        value: payment.payee_added_date_utc,
        disabled: true,
      }),
      payee_due_date: new FormControl(payment.payee_due_date),
      payee_payment_status: new FormControl(payment.payee_payment_status),
      total_due: new FormControl({ value: payment.total_due, disabled: true }),
      due_amount: new FormControl(payment.due_amount),
      currency: new FormControl({ value: payment.currency, disabled: true }),
      discount_percent: new FormControl({
        value: payment.discount_percent,
        disabled: true,
      }),
      tax_percent: new FormControl({
        value: payment.tax_percent,
        disabled: true,
      }),
      payee_address_line_1: new FormControl({
        value: payment.payee_address_line_1,
        disabled: true,
      }),
      payee_address_line_2: new FormControl({
        value: payment.payee_address_line_2,
        disabled: true,
      }),
      payee_city: new FormControl({
        value: payment.payee_city,
        disabled: true,
      }),
      payee_country: new FormControl({
        value: payment.payee_country,
        disabled: true,
      }),
      payee_province_or_state: new FormControl({
        value: payment.payee_province_or_state,
        disabled: true,
      }),
      payee_postal_code: new FormControl({
        value: payment.payee_postal_code,
        disabled: true,
      }),
      payee_phone_number: new FormControl({
        value: payment.payee_phone_number,
        disabled: true,
      }),
      payee_email: new FormControl({
        value: payment.payee_email,
        disabled: true,
      }),
      evidence_file: new FormControl(null), // New form control for file upload
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    console.log(this.paymentForm.get('evidence_file')?.value?.name, file.name);
    if (file) {
      this.selectedFile = file;
      console.log(this.selectedFile);
      this.paymentForm.patchValue({ evidence_file: file.name }); // Store filename only
    }
  }

  onSubmit() {
    if (this.paymentForm.invalid) {
      return;
    }

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
        alert('Payment updated successfully!');
        this.isLoading = false;
        this.errorMessage = '';
      },
      error: (err) => {
        this.errorMessage = err.error.error
          ? err.error.error
          : 'Error updating payment';
        this.isLoading = false;
      },
    });
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
