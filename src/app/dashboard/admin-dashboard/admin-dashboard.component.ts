import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { TripService } from '../../trips/trip.service';
import { AuthService } from '../../core/auth.service';
import { TripDTO } from '../../core/models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  trips: TripDTO[] = [];
  departedTrips: TripDTO[] = [];
  loading = false;
  error = '';
  success = '';
  user: any = null;
  searchOrigin = '';
  searchDestination = '';
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  currentPageDeparted = 1;
  itemsPerPageDeparted = 10;

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
      console.log('Search results changed, reset to page 1');
    }
    
    return filtered;
  }

  // Add search watchers to reset pagination when search changes
  onSearchChange(): void {
    this.currentPage = 1;
    this.currentPageDeparted = 1;
    console.log('Search changed, reset both paginations to page 1');
  }

  get paginatedTrips(): TripDTO[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const result = this.filteredTrips.slice(startIndex, endIndex);
    console.log('paginatedTrips - currentPage:', this.currentPage, 'itemsPerPage:', this.itemsPerPage, 'startIndex:', startIndex, 'endIndex:', endIndex, 'result.length:', result.length);
    return result;
  }

  get paginatedDepartedTrips(): TripDTO[] {
    const startIndex = (this.currentPageDeparted - 1) * this.itemsPerPageDeparted;
    const endIndex = startIndex + this.itemsPerPageDeparted;
    const result = this.departedTrips.slice(startIndex, endIndex);
    console.log('paginatedDepartedTrips - currentPageDeparted:', this.currentPageDeparted, 'itemsPerPageDeparted:', this.itemsPerPageDeparted, 'startIndex:', startIndex, 'endIndex:', endIndex, 'result.length:', result.length);
    return result;
  }

  get totalPages(): number {
    const total = globalThis.Math.ceil(this.filteredTrips.length / this.itemsPerPage);
    console.log('totalPages calculated:', total, 'filteredTrips.length:', this.filteredTrips.length, 'itemsPerPage:', this.itemsPerPage);
    return total;
  }

  get totalPagesDeparted(): number {
    const total = globalThis.Math.ceil(this.departedTrips.length / this.itemsPerPageDeparted);
    console.log('totalPagesDeparted calculated:', total, 'departedTrips.length:', this.departedTrips.length, 'itemsPerPageDeparted:', this.itemsPerPageDeparted);
    return total;
  }

  constructor(
    private tripService: TripService,
    private authService: AuthService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadAllTrips();
    this.loadDepartedTrips();
  }

  loadAllTrips(): void {
    this.loading = true;
    
    // Debug: Check user role and token
    console.log('Current user:', this.user);
    console.log('Is admin:', this.authService.isAdmin());
    console.log('Token exists:', !!this.authService.getToken());
    
    this.tripService.getAllTrips().subscribe({
      next: (trips) => {
        this.trips = trips;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading trips:', error);
        this.error = 'Failed to load trips';
        this.loading = false;
      }
    });
  }

  loadDepartedTrips(): void {
    this.tripService.getDepartedTrips().subscribe({
      next: (trips) => {
        this.departedTrips = trips;
      },
      error: (error) => {
        console.error('Error loading departed trips:', error);
      }
    });
  }

  cancelTrip(tripId: number | string | undefined): void {
    console.log('cancelTrip clicked with id:', tripId);
    if (!tripId) return;
    const idNum = typeof tripId === 'string' ? Number(tripId) : tripId;
    
    if (!confirm('Are you sure you want to cancel this trip? This will affect all bookings for this trip.')) {
      return;
    }

    this.tripService.cancelTrip(idNum).subscribe({
      next: () => {
        this.success = '✅ Trip cancelled successfully';
        this.error = '';
        this.loadAllTrips(); // Refresh the list
        setTimeout(() => {
          this.success = '';
        }, 3000);
      },
      error: () => {
        this.error = '❌ Failed to cancel trip';
        this.success = '';
      }
    });
  }

  deleteTrip(tripId: number | string | undefined): void {
    console.log('deleteTrip clicked with id:', tripId);
    if (!tripId) return;
    const idNum = typeof tripId === 'string' ? Number(tripId) : tripId;
    
    if (!confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      return;
    }

    this.tripService.deleteTrip(idNum).subscribe({
      next: () => {
        this.success = '✅ Trip deleted successfully';
        this.error = '';
        this.loadAllTrips(); // Refresh the list
        setTimeout(() => {
          this.success = '';
        }, 3000);
      },
      error: () => {
        this.error = '❌ Failed to delete trip';
        this.success = '';
      }
    });
  }

  bookTrip(tripId: number | string | undefined): void {
    console.log('bookTrip clicked with id:', tripId);
    if (!tripId) return;
    this.router.navigate(['/seat-selection'], {
      queryParams: { tripId }
    });
  }

  createNewTrip(): void {
    this.router.navigate(['/create-trip']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getStatusClass(status: string | undefined): string {
    return status === 'ACTIVE' ? 'status-active' : 'status-cancelled';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getFutureTripsCount(): number {
    const now = new Date();
    return this.trips.filter(trip => {
      const departureTime = new Date(trip.departureTime);
      return departureTime > now;
    }).length;
  }

  getCancelledTripsCount(): number {
    return this.trips.filter(trip => trip.status === 'CANCELLED').length;
  }

  getTotalTripsCount(): number {
    return this.trips.length + this.departedTrips.length;
  }

  getTripId(trip: any): number | undefined {
    const raw = trip?.id ?? trip?.tripId;
    if (raw === undefined || raw === null) return undefined;
    const coerced = typeof raw === 'string' ? Number(raw) : raw;
    return Number.isFinite(coerced) ? coerced as number : undefined;
  }

  // Pagination methods
  goToPage(page: number): void {
    console.log('goToPage called with:', page);
    console.log('totalPages:', this.totalPages);
    console.log('filteredTrips.length:', this.filteredTrips.length);
    console.log('itemsPerPage:', this.itemsPerPage);
    
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      console.log('Page changed to:', this.currentPage);
    } else {
      console.log('Invalid page number:', page);
    }
  }

  goToPageDeparted(page: number): void {
    if (page >= 1 && page <= this.totalPagesDeparted) {
      this.currentPageDeparted = page;
    }
  }

  onItemsPerPageChange(): void {
    // Reset to first page when changing items per page
    console.log('Items per page changed to:', this.itemsPerPage);
    this.currentPage = 1;
    console.log('Reset to page:', this.currentPage);
  }

  onItemsPerPageDepartedChange(): void {
    // Reset to first page when changing items per page for departed trips
    console.log('Items per page for departed trips changed to:', this.itemsPerPageDeparted);
    this.currentPageDeparted = 1;
    console.log('Reset departed trips to page:', this.currentPageDeparted);
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

  getPageNumbersDeparted(): number[] {
    const pages: number[] = [];
    const maxPages = globalThis.Math.min(5, this.totalPagesDeparted);
    const start = globalThis.Math.max(1, this.currentPageDeparted - 2);
    const end = globalThis.Math.min(this.totalPagesDeparted, start + maxPages - 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    console.log('getPageNumbersDeparted - pages:', pages, 'maxPages:', maxPages, 'start:', start, 'end:', end);
    return pages;
  }

  // Helper methods for template
  getMin(a: number, b: number): number {
    return globalThis.Math.min(a, b);
  }

  getMax(a: number, b: number): number {
    return globalThis.Math.max(a, b);
  }


}
