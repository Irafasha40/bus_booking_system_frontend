import { Component } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TripService } from '../trip.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-trip',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIf],
  styleUrls: ['./trip-create.component.css'],
  templateUrl: './trip-create.component.html'
})
export class CreateTripComponent {
  tripForm: FormGroup;
  success = '';
  error = '';
  loading = false;

  constructor(
    private fb: FormBuilder, 
    private tripService: TripService,
    private router: Router
  ) {
    this.tripForm = this.fb.group({
      origin: ['', Validators.required],
      destination: ['', Validators.required],
      departureTime: ['', Validators.required],
      arrivalTime: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      totalSeats: ['', [Validators.required, Validators.min(1), Validators.max(100)]],
      busNumber: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  onSubmit(): void {
    if (this.tripForm.invalid) return;

    this.loading = true;
    this.tripService.createTrip(this.tripForm.value).subscribe({
      next: () => {
        this.success = '✅ Trip created successfully';
        this.error = '';
        this.tripForm.reset();
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/admin/dashboard']);
        }, 2000);
      },
      error: () => {
        this.error = '❌ Failed to create trip';
        this.success = '';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}
