import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { BookingService } from '../booking.service';
import { AuthService } from '../../core/auth.service';
import { BookingDTO } from '../../core/models';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-booking-history',
  standalone: true,
  imports: [CommonModule, NgIf, FormsModule],
  templateUrl: './booking-history.html',
  styleUrl: './booking-history.css'
})
export class BookingHistory implements OnInit {
  bookings: BookingDTO[] = [];
  filteredBookings: BookingDTO[] = [];
  loading = false;
  error = '';
  success = '';
  
  // Search filters
  searchTerm = '';
  searchField = 'all'; // all, passenger, id, destination, origin, status, date

  constructor(
    private bookingService: BookingService,
    private authService: AuthService,
    private router: Router
  ) {}

  get isAdminRole(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    const source$ = this.isAdminRole
      ? this.bookingService.getAllBookings()
      : this.bookingService.getUserBookings();

    source$.subscribe({
      next: (bookings) => {
        this.bookings = bookings;
        this.filteredBookings = bookings;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load booking history';
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredBookings = this.bookings;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();
    
    this.filteredBookings = this.bookings.filter(booking => {
      switch (this.searchField) {
        case 'passenger':
          return this.searchInPassengerDetails(booking, searchLower);
        case 'id':
          return this.searchInBookingId(booking, searchLower);
        case 'destination':
          return this.searchInDestination(booking, searchLower);
        case 'origin':
          return this.searchInOrigin(booking, searchLower);
        case 'status':
          return this.searchInStatus(booking, searchLower);
        case 'date':
          return this.searchInDate(booking, searchLower);
        case 'seats':
          return this.searchInSeats(booking, searchLower);
        case 'price':
          return this.searchInPrice(booking, searchLower);
        default: // 'all'
          return this.searchInAllFields(booking, searchLower);
      }
    });
  }

  private searchInPassengerDetails(booking: BookingDTO, searchTerm: string): boolean {
    if (!booking.passengerDetails) return false;
    return booking.passengerDetails.some(passenger => 
      passenger.name?.toLowerCase().includes(searchTerm) ||
      passenger.gender?.toLowerCase().includes(searchTerm) ||
      String(passenger.age).includes(searchTerm)
    );
  }

  private searchInBookingId(booking: BookingDTO, searchTerm: string): boolean {
    const bookingId = booking.bookingId || booking.id;
    return String(bookingId).toLowerCase().includes(searchTerm);
  }

  private searchInDestination(booking: BookingDTO, searchTerm: string): boolean {
    return booking.trip?.destination?.toLowerCase().includes(searchTerm) || false;
  }

  private searchInOrigin(booking: BookingDTO, searchTerm: string): boolean {
    return booking.trip?.origin?.toLowerCase().includes(searchTerm) || false;
  }

  private searchInStatus(booking: BookingDTO, searchTerm: string): boolean {
    return booking.status?.toLowerCase().includes(searchTerm) || false;
  }

  private searchInDate(booking: BookingDTO, searchTerm: string): boolean {
    if (!booking.bookingDate) return false;
    const date = new Date(booking.bookingDate);
    const dateString = date.toLocaleDateString();
    const timeString = date.toLocaleTimeString();
    return dateString.includes(searchTerm) || timeString.includes(searchTerm);
  }

  private searchInSeats(booking: BookingDTO, searchTerm: string): boolean {
    const seatNumbers = booking.seatNumbers || [];
    const seatNumber = booking.seatNumber;
    
    if (seatNumbers.length > 0) {
      return seatNumbers.some(seat => String(seat).includes(searchTerm));
    }
    return String(seatNumber).includes(searchTerm);
  }

  private searchInPrice(booking: BookingDTO, searchTerm: string): boolean {
    return String(booking.totalPrice).includes(searchTerm);
  }

  private searchInAllFields(booking: BookingDTO, searchTerm: string): boolean {
    return (
      this.searchInPassengerDetails(booking, searchTerm) ||
      this.searchInBookingId(booking, searchTerm) ||
      this.searchInDestination(booking, searchTerm) ||
      this.searchInOrigin(booking, searchTerm) ||
      this.searchInStatus(booking, searchTerm) ||
      this.searchInDate(booking, searchTerm) ||
      this.searchInSeats(booking, searchTerm) ||
      this.searchInPrice(booking, searchTerm)
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchField = 'all';
    this.filteredBookings = this.bookings;
  }

  cancelBooking(bookingId: string | number): void {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    const id = String(bookingId);
    this.bookingService.cancelBooking(id).subscribe({
      next: () => {
        this.success = '✅ Booking cancelled successfully';
        this.error = '';
        this.loadBookings(); // Refresh the list
      },
      error: () => {
        this.error = '❌ Failed to cancel booking';
        this.success = '';
      }
    });
  }

  goBack(): void {
    if (this.isAdminRole) {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  private normalizeStatus(status: string | undefined): string {
    return (status || '').toUpperCase();
  }

  getStatusClass(status: string): string {
    return this.normalizeStatus(status) === 'CONFIRMED' ? 'status-confirmed' : 'status-cancelled';
  }

  isCancelled(status: string | undefined): boolean {
    return this.normalizeStatus(status) === 'CANCELLED';
  }

  canCancelBooking(booking: BookingDTO): boolean {
    // Allow cancel if not already cancelled
    return !this.isCancelled(booking.status as any);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
