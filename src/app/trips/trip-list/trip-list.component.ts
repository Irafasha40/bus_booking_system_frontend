//import { Component } from '@angular/core';

import { Component, OnInit } from '@angular/core';
import { TripService } from '../trip.service';
import { TripDTO } from '../../core/models';
import { CurrencyPipe, DatePipe, NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-trip-list',
  imports: [
    CurrencyPipe,
    DatePipe,
    NgIf,
    NgFor,
    FormsModule
  ],
  templateUrl: './trip-list.component.html',
  styleUrl: './trip-list.component.css'
})
export class TripListComponent implements OnInit {
  trips: TripDTO[] = [];
  error = '';
  searchOrigin = '';
  searchDestination = '';
  searchDepartureDate = '';

  get filteredTrips(): TripDTO[] {
    const origin = this.searchOrigin.trim().toLowerCase();
    const destination = this.searchDestination.trim().toLowerCase();
    const depDate = this.searchDepartureDate;

    return this.trips.filter(trip => {
      const matchesOrigin = !origin || (trip.origin || '').toLowerCase().includes(origin);
      const matchesDestination = !destination || (trip.destination || '').toLowerCase().includes(destination);
      const matchesDate = !depDate || (new Date(trip.departureTime).toISOString().slice(0, 10) === depDate);
      return matchesOrigin && matchesDestination && matchesDate;
    });
  }

  constructor(
    private tripService: TripService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTrips();
  }

  loadTrips(): void {
    this.tripService.getTrips().subscribe({
      next: (data) => {
        this.trips = data;
        this.error = '';
      },
      error: () => this.error = 'Failed to load trips 🚌'
    });
  }

  onSearch(): void {
    // No server call needed; filteredTrips reacts to inputs
  }

  bookTrip(tripId: number | string): void {
    this.router.navigate(['/seat-selection'], { 
      queryParams: { tripId: tripId } 
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
