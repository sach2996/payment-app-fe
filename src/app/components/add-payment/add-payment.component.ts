import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { CoreService } from '../../core/services/core.service';

interface Country {
  iso2: string;
  iso3: string;
  country: string;
  cities: string[];
}

@Component({
  selector: 'app-add-payment',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './add-payment.component.html',
  styleUrls: ['./add-payment.component.css'],
})
export class AddPaymentComponent implements OnInit {
  paymentForm!: FormGroup;
  paymentStatusOptions: { [key: string]: string } = {
    pending: 'Pending',
    // completed: 'Completed',
    // due_now: 'Due Now',
    // overdue: 'Overdue',
  };
  countries: Country[] = [];
  cities: string[] = [];
  states: string[] = [];
  currencies: any;

  currentDate: string = new Date().toISOString().split('T')[0];
  objectKeys(obj: object): string[] {
    return Object.keys(obj);
  }
  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private http: HttpClient,
    private router: Router,
    private coreService: CoreService
  ) {}

  ngOnInit() {
    this.createForm();
    this.fetchCountries();
    this.fetchCurrencies();
  }

  createForm() {
    this.paymentForm = this.fb.group({
      payee_first_name: ['', Validators.required],
      payee_last_name: ['', Validators.required],
      payee_payment_status: ['', Validators.required],
      payee_added_date_utc: new Date(),
      payee_due_date: ['', Validators.required],
      currency: ['', [Validators.required]],
      due_amount: [0, [Validators.required, Validators.min(0)]],
      discount_percent: [0, [Validators.min(0), Validators.max(100)]],
      tax_percent: [0, [Validators.min(0), Validators.max(100)]],
      payee_address_line_1: ['', Validators.required],
      payee_address_line_2: [''],
      payee_country: ['', Validators.required],
      payee_city: ['', Validators.required],
      payee_province_or_state: ['', Validators.required],
      payee_postal_code: [
        '',
        [Validators.required, Validators.minLength(4), Validators.maxLength(6)],
      ],
      payee_phone_number: [
        '',
        [Validators.required, Validators.pattern('^[0-9]{8,11}$')],
      ],
      payee_email: ['', [Validators.required, Validators.email]],
    });
    this.paymentForm
      .get('payee_country')
      ?.valueChanges.subscribe((countryCode) => {
        this.fetchStates(countryCode);
      });
  }

  fetchCountries() {
    this.coreService.getCountries().subscribe({
      next: (response) => {
        if (response.data && Array.isArray(response.data)) {
          this.countries = response.data;
        } else {
          console.error('Invalid countries data:', response);
        }
      },
      error: (err) => {
        console.error('Error fetching countries:', err);
      },
    });
  }
  fetchStates(countryCode: string) {
    if (countryCode) {
      this.coreService.getStates(countryCode).subscribe({
        next: (response) => {
          const countryData = response.data.filter((country: any) => {
            if (country.name === countryCode) {
              return country.states;
            }
          });
          if (countryData) {
            this.states = countryData[0]?.states.map(
              (state: any) => state.name
            );
            this.updateCities(countryCode);
          } else {
            this.states = [];
          }
        },
        error: (err) => {
          console.error('Error fetching states:', err);
        },
      });
    }
  }
  updateCities(countryName: String) {
    for (let country of this.countries) {
      if (country.country.toLowerCase() === countryName.toLowerCase()) {
        this.cities = country.cities;
      }
    }
  }

  fetchCurrencies() {
    this.coreService.getCurrencies().subscribe({
      next: (data) => {
        this.currencies = Object.entries(data).map(([code, name]) => ({
          code,
          name,
        }));
      },
      error: (err) => {
        console.error('Error fetching currencies:', err);
      },
    });
  }

  onSubmit() {
    const utcTimestamp = new Date().toISOString(); // Convert to UTC timestamp

    this.paymentForm.patchValue({
      payee_added_date_utc: utcTimestamp,
    });
    if (this.paymentForm.valid) {
      const newPayment = this.paymentForm.value;
      this.paymentService.createPayment(newPayment).subscribe(
        (response) => {
          this.router.navigate([`/payments/view/${response?.id}`]);
        },
        (error) => {
          console.error('Error creating payment:', error);
        }
      );
    } else {
      alert('Payment form is invalid');
    }
  }
}
