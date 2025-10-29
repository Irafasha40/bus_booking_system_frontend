import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BookingService } from '../booking.service';
import { TripService } from '../../trips/trip.service';
import { AuthService } from '../../core/auth.service';
import { SeatDTO, TripDTO, CreateBookingRequest, PassengerDetail } from '../../core/models';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, FormsModule],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.css'
})
export class SeatSelection implements OnInit {
  tripId: number | string = 0;
  trip: TripDTO | null = null;
  seats: SeatDTO[] = [];
  selectedSeats: string[] = [];
  passengerDetails: PassengerDetail[] = [];
  loading = false;
  error = '';
  success = '';

  columnsPerRow = 4;
  seatGrid: number[][] = [];
  private apiBookedSeats: Set<string> = new Set<string>();

  constructor(
    private bookingService: BookingService,
    private tripService: TripService,
    private authService: AuthService,
    public router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const raw = params['tripId'] ?? params['id'] ?? params['trip_id'];
      this.tripId = raw ?? 0;
      if (this.tripId) {
        this.loadTripDetails();
      } else {
        this.error = 'No trip selected';
      }
    });
  }

  private buildSeatGrid(totalSeats: number): void {
    const numbers: number[] = Array.from({ length: totalSeats }, (_, i) => i + 1);
    const grid: number[][] = [];
    for (let i = 0; i < numbers.length; i += this.columnsPerRow) {
      grid.push(numbers.slice(i, i + this.columnsPerRow));
    }
    this.seatGrid = grid;
  }

  private computeSeats(): void {
    if (!this.trip) return;
    const total = this.trip.totalSeats;
    const booked = new Set<string>(Array.from(this.apiBookedSeats));
    this.seats = Array.from({ length: total }, (_, idx) => {
      const num = String(idx + 1);
      return { seatNumber: num, isBooked: booked.has(num) } as SeatDTO;
    });
  }

  loadTripDetails(): void {
    const idForApi = typeof this.tripId === 'string' ? Number(this.tripId) : this.tripId;
    this.loading = true;
    this.tripService.getTripById(idForApi as number).subscribe({
      next: (trip) => {
        this.trip = trip;
        this.buildSeatGrid(trip.totalSeats);
        this.fetchBookedSeatsAndRender();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load trip details';
        this.loading = false;
      }
    });
  }

  private fetchBookedSeatsAndRender(): void {
    if (!this.trip) {
      this.computeSeats();
      return;
    }
    const tripIdAny: any = (this.trip as any).id ?? (this.trip as any).tripId;
    const tripIdNum = typeof tripIdAny === 'string' ? Number(tripIdAny) : tripIdAny;
    if (!Number.isFinite(tripIdNum)) {
      this.computeSeats();
      return;
    }
    this.bookingService.getBookedSeatsForTrip(tripIdNum as number).subscribe({
      next: (numbers) => {
        this.apiBookedSeats = new Set((numbers || []).map(s => String(s)));
        this.computeSeats();
      },
      error: () => {
        // fallback: no API seats; show all as available
        this.apiBookedSeats = new Set();
        this.computeSeats();
      }
    });
  }

  toggleSeat(seatNumber: number): void {
    const seatStr = String(seatNumber);
    if (this.isSeatBooked(seatNumber)) return;

    const index = this.selectedSeats.indexOf(seatStr);
    if (index >= 0) {
      this.selectedSeats.splice(index, 1);
      this.passengerDetails = this.passengerDetails.filter(p => String(p.seatNumber) !== seatStr);
    } else {
      this.selectedSeats.push(seatStr);
      this.passengerDetails.push({ name: '', age: 0, gender: 'other', seatNumber: seatNumber });
    }
  }

  bookSeats(): void {
    if (this.selectedSeats.length === 0) {
      this.error = 'Please select at least one seat';
      return;
    }

    for (const detail of this.passengerDetails) {
      if (!detail.name || detail.seatNumber === undefined || detail.seatNumber === null) {
        this.error = 'Please fill passenger name for each selected seat';
        return;
      }
    }

    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const seatNumbers = this.selectedSeats.map(s => String(s));
    const normalizedPassengerDetails: PassengerDetail[] = this.passengerDetails.map(p => ({
      ...p,
      seatNumber: parseInt(String(p.seatNumber), 10)
    }));

    const request: CreateBookingRequest = {
      tripId: this.tripId,
      seatNumbers,
      passengerDetails: normalizedPassengerDetails
    };

    this.loading = true;
    this.bookingService.createBooking(request).subscribe({
      next: () => {
        this.success = '✅ Booking created successfully!';
        this.error = '';
        this.selectedSeats = [];
        this.passengerDetails = [];
        // Reload trip details to refresh booked seats
        this.loadTripDetails();
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      },
      error: () => {
        this.error = '❌ Failed to create booking. Please try again.';
        this.success = '';
        this.loading = false;
      }
    });
  }

  isSeatBooked(seatNumber: number): boolean {
    const seat = this.seats.find(s => s.seatNumber === String(seatNumber));
    return seat ? seat.isBooked : false;
  }

  isSeatSelected(seatNumber: number): boolean {
    return this.selectedSeats.includes(String(seatNumber));
  }

  getSeatClass(seatNumber: number): string {
    if (this.isSeatBooked(seatNumber)) return 'seat booked';
    if (this.isSeatSelected(seatNumber)) return 'seat selected';
    return 'seat available';
  }
}
