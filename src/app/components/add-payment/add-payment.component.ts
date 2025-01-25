import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { PaymentService } from '../../core/services/payment.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface Country {
  iso2: string;
  iso3: string;
  country: string;
  cities: string[];
}

@Component({
  selector: 'app-add-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-payment.component.html',
  styleUrls: ['./add-payment.component.css'],
})
export class AddPaymentComponent implements OnInit {
  paymentForm!: FormGroup;
  paymentStatuses = ['pending'];
  countries: Country[] = [];
  cities: string[] = [];
  states: string[] = [];
  currencies: string[] = ['USD', 'EUR', 'GBP', 'INR'];

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.createForm();
    this.fetchCountries();
  }

  createForm() {
    this.paymentForm = this.fb.group({
      payee_first_name: ['', Validators.required],
      payee_last_name: ['', Validators.required],
      payee_added_date_utc: ['', Validators.required], // Update validation
      payee_due_date: ['', Validators.required], // Update validation
      payee_payment_status: ['pending', Validators.required],
      due_amount: ['', [Validators.required, Validators.min(0)]], // Update validation
      currency: ['USD'],
      discount_percent: [0, [Validators.min(0), Validators.max(100)]],
      tax_percent: [0, [Validators.min(0), Validators.max(100)]],
      payee_address_line_1: ['', Validators.required],
      payee_address_line_2: [''],
      payee_city: ['', Validators.required],
      payee_country: ['', Validators.required],
      payee_province_or_state: [''],
      payee_postal_code: ['', Validators.required],
      payee_phone_number: ['', [Validators.required, this.phoneValidator]], // Add custom validator
      payee_email: ['', [Validators.required, Validators.email]],
    });

    this.paymentForm
      .get('payee_country')
      ?.valueChanges.subscribe((countryCode) => {
        console.log(countryCode);
        this.cities = []; // Clear previous city suggestions
        this.states = []; // Clear previous state suggestions
        this.fetchStates(countryCode);
        this.updateCities();
      });
  }

  phoneValidator(control: any) {
    const phoneRegex = /^\d+$/; // Replace with a more robust phone number validation regex
    if (control.value && !phoneRegex.test(control.value)) {
      return { invalidPhone: true };
    }
    return null;
  }

  fetchCountries() {
    this.http
      .get<any>('https://countriesnow.space/api/v0.1/countries')
      .subscribe({
        next: (response) => {
          this.countries = response.data;
        },
        error: (err) => {
          console.error('Error fetching countries:', err);
        },
      });
  }

  fetchStates(countryCode: string) {
    if (countryCode) {
      this.http
        .get<any>(`https://countriesnow.space/api/v0.1/countries/states`, {
          params: { country: countryCode },
        })
        .subscribe({
          next: (response) => {
            const countryData = response.data.filter((country: any) => {
              if (country.name === countryCode) {
                return country.states;
              }
            });
            if (countryData) {
              this.states = countryData[0].states.map(
                (state: any) => state.name
              );
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
  updateCities() {
    const countryName = this.paymentForm.value.payee_country;
    // const citiesData = this.countries.filter((country: any) => {
    //   if (country.country.toLowerCase() === countryName.toLowerCase()) {
    //     return country.cities;
    //   }
    // });
    // console.log('cititesData ', citiesData);
    // if (citiesData) {
    //   this.cities = citiesData;
    // } else {
    //   this.cities = [];
    // }
  }
  onSubmit() {
    console.log('hi');
    const utcTimestamp = new Date().toISOString(); // Convert to UTC timestamp
    console.log('UTC Timestamp:', utcTimestamp);

    // Update the form control for UTC timestamp
    this.paymentForm.patchValue({
      payee_added_date_utc: utcTimestamp,
    });
    if (this.paymentForm.valid) {
      const newPayment = this.paymentForm.value;
      console.log('New Payment:', newPayment);
      this.paymentService.createPayment(newPayment).subscribe(
        (response) => {
          console.log('Payment created successfully:', response);
          this.router.navigate([`/payments/edit/${response?.id}`]);
          // Handle successful creation (e.g., navigate to payment list)
        },
        (error) => {
          console.error('Error creating payment:', error);
          // Handle errors appropriately (e.g., display error message to user)
        }
      );
    } else {
      console.error('Payment form is invalid');
      // Handle form validation errors (e.g., display error messages to user)
    }
  }

  onDateChange(event: any) {
    const selectedDate = new Date(event.target.value); // Get the selected date
    const utcTimestamp = selectedDate.toISOString(); // Convert to UTC timestamp
    console.log('Selected Date:', selectedDate);
    console.log('UTC Timestamp:', utcTimestamp);

    // Update the form control for UTC timestamp
    this.paymentForm.patchValue({
      payee_added_date_utc: utcTimestamp,
    });
  }
  onCountryInput(event: any) {
    const countryInput = event.target.value;
    console.log('oncountryinput', countryInput);
    if (countryInput.length > 2) {
      this.fetchCountries();
    }
  }

  onStateInput(event: any) {
    const countryName = this.paymentForm.value.payee_country;
    console.log('countryName ', countryName);
    if (countryName) {
      this.fetchStates(countryName);
    }
  }
  onCityInput(event: any) {
    const cityInput = event.target.value;
    if (cityInput.length > 2) {
      // Replace this with your actual city suggestion logic
      // (e.g., using Google Maps Places API)
      this.cities = ['New York', 'Los Angeles', 'Chicago', 'Houston'];
    } else {
      this.cities = [];
    }
  }
}
