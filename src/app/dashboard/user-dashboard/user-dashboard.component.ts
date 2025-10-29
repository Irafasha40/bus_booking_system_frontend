import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { TripService } from '../../trips/trip.service';
import { BookingService } from '../../booking/booking.service';
import { AuthService } from '../../core/auth.service';
import { TripDTO, BookingDTO } from '../../core/models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, FormsModule],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css'
})
export class UserDashboardComponent implements OnInit {
  trips: TripDTO[] = [];
  recentBookings: BookingDTO[] = [];
  allBookings: BookingDTO[] = [];
  loading = false;
  error = '';
  user: any = null;
  
  // Search properties
  searchOrigin = '';
  searchDestination = '';
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  viewMode: 'cards' | 'table' = 'cards';

  constructor(
    private tripService: TripService,
    private bookingService: BookingService,
    private authService: AuthService,
    public router: Router
  ) {}

  get isAdminRole(): boolean {
    return this.authService.isAdmin();
  }

  get filteredTrips(): TripDTO[] {
    const origin = this.searchOrigin.trim().toLowerCase();
    const destination = this.searchDestination.trim().toLowerCase();
    const filtered = this.trips.filter(trip => {
      const matchesOrigin = !origin || (trip.origin?.toLowerCase().includes(origin));
      const matchesDestination = !destination || (trip.destination?.toLowerCase().includes(destination));
      return matchesOrigin && matchesDestination;
    });
    
    // Reset to first page when search results change
    if (this.currentPage > 1 && this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    
    return filtered;
  }

  get paginatedTrips(): TripDTO[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredTrips.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return globalThis.Math.ceil(this.filteredTrips.length / this.itemsPerPage);
  }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    console.log('User dashboard - Current user:', this.user);
    console.log('User dashboard - Is admin:', this.authService.isAdmin());
    console.log('User dashboard - Token exists:', !!this.authService.getToken());
    
    this.loadTrips();
    this.loadBookings();
  }

    loadTrips(): void {
    this.loading = true;
    console.log('User dashboard - Starting to load trips...');
    
    this.tripService.getAllTrips().subscribe({
      next: (trips) => {
        console.log('Raw trips received:', trips);
        console.log('Trips length:', trips?.length);
        
        // Temporarily show all trips for debugging
        this.trips = trips;
        console.log('All trips loaded (no filtering):', this.trips);
        
        // Original filtering logic (commented out for debugging)
        /*
        this.trips = trips.filter(trip => {
          const statusActive = (trip.status || '').toUpperCase() === 'ACTIVE';
          const seatsAvailable = trip.availableSeats === undefined || (trip.availableSeats ?? 0) > 0;
          console.log('Trip:', trip.origin, '->', trip.destination, 'Status:', trip.status, 'Seats:', trip.availableSeats, 'Active:', statusActive, 'SeatsAvailable:', seatsAvailable);
          return statusActive && seatsAvailable;
        });
        */
        
        console.log('Filtered trips:', this.trips);
        console.log('Filtered trips length:', this.trips.length);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading trips:', error);
        this.error = 'Failed to load trips';
        this.loading = false;
      }
    });
  }

  loadBookings(): void {
    if (!this.user) return;

    this.bookingService.getUserBookings().subscribe({
      next: (bookings) => {
        if (this.isAdminRole) {
          this.allBookings = bookings;
        } else {
          this.recentBookings = bookings.slice(0, 3);
        }
      },
      error: () => {
        // silent
      }
    });
  }

  bookTrip(tripId: number | string): void {
    this.router.navigate(['/seat-selection'], { 
      queryParams: { tripId: tripId } 
    });
  }

  viewAllBookings(): void {
    this.router.navigate(['/booking-history']);
  }

  viewTrips(): void {
    this.router.navigate(['/trips']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getStatusClass(status: string): string {
    return status === 'CONFIRMED' ? 'status-confirmed' : 'status-cancelled';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Search change handler
  onSearchChange(): void {
    this.currentPage = 1; // Reset to first page when search changes
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = globalThis.Math.min(5, this.totalPages);
    const start = globalThis.Math.max(1, this.currentPage - 2);
    const end = globalThis.Math.min(this.totalPages, start + maxPages - 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // View mode toggle
  setViewMode(mode: 'cards' | 'table'): void {
    this.viewMode = mode;
    this.currentPage = 1; // Reset to first page when changing view
  }

  // Helper methods for template
  getMin(a: number, b: number): number {
    return globalThis.Math.min(a, b);
  }

  // Debug method to test API
  debugTrips(): void {
    console.log('=== DEBUG TRIPS ===');
    console.log('Current trips array:', this.trips);
    console.log('Current filteredTrips:', this.filteredTrips);
    console.log('Current loading state:', this.loading);
    console.log('Current error state:', this.error);
    console.log('Current user:', this.user);
    console.log('Is admin:', this.authService.isAdmin());
    console.log('Token exists:', !!this.authService.getToken());
    
    // Test API directly
    this.tripService.getAllTrips().subscribe({
      next: (trips) => {
        console.log('Direct API call result:', trips);
        console.log('Direct API trips length:', trips?.length);
        if (trips && trips.length > 0) {
          console.log('First trip sample:', trips[0]);
        }
      },
      error: (error) => {
        console.error('Direct API call error:', error);
      }
    });
  }
}
