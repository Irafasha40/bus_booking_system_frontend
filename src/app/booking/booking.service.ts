import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BookingDTO, CreateBookingRequest, TripDTO } from '../core/models';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = 'http://localhost:8080/api/bookings';

  constructor(private http: HttpClient) {}

  // Get current user's bookings (backend uses authenticated principal)
  getUserBookings(): Observable<BookingDTO[]> {
    return this.http.get<unknown>(`${this.apiUrl}`).pipe(
      map((res: any) => Array.isArray(res) ? res : (res?.data ?? [])),
      map((items: any[]) => items.map((b) => this.mapBooking(b)))
    );
  }

  // Get all bookings (admin only)
  getAllBookings(): Observable<BookingDTO[]> {
    return this.http.get<unknown>(`${this.apiUrl}/all`).pipe(
      map((res: any) => Array.isArray(res) ? res : (res?.data ?? [])),
      map((items: any[]) => items.map((b) => this.mapBooking(b)))
    );
  }

  // Create a new booking (multi-seat supported)
  createBooking(request: CreateBookingRequest): Observable<BookingDTO> {
    return this.http.post<unknown>(this.apiUrl, request).pipe(
      map((res: any) => this.mapBooking(Array.isArray(res) ? res[0] : (res?.data ?? res)))
    );
  }

  // Get currently booked seat numbers for a trip (backend excludes cancelled)
  getBookedSeatsForTrip(tripId: number): Observable<string[]> {
    return this.http.get<unknown>(`${this.apiUrl}/trip/${tripId}/booked-seats`).pipe(
      map((res: any) => Array.isArray(res) ? res : (res?.data ?? [])),
      map((items: any[]) => items.map((n) => String(n)))
    );
  }

  // Cancel a booking
  cancelBooking(bookingId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${bookingId}`);
  }

  // Get booking by ID
  getBookingById(bookingId: string): Observable<BookingDTO> {
    return this.http.get<unknown>(`${this.apiUrl}/${bookingId}`).pipe(
      map((res: any) => this.mapBooking(res?.data ?? res))
    );
  }

  private mapBooking(b: any): BookingDTO {
    if (!b) return {} as BookingDTO;

    const trip: TripDTO | undefined = b.tripDetails ? {
      origin: b.tripDetails.origin,
      destination: b.tripDetails.destination,
      departureTime: b.tripDetails.departureTime,
      arrivalTime: b.tripDetails.arrivalTime,
      price: b.tripDetails.price,
      totalSeats: b.tripDetails.totalSeats,
      busNumber: b.tripDetails.busNumber,
      status: (b.tripDetails.status || 'ACTIVE').toUpperCase()
    } : b.trip;

    const status = (b.bookingStatus || b.status || '').toString().toUpperCase();

    return {
      id: b.id,
      bookingId: b.bookingId ?? (b.id ? String(b.id) : undefined),
      tripId: b.tripId ?? b.trip?.id ?? 0,
      userId: b.userId,
      seatNumber: b.seatNumber,
      seatNumbers: b.seatNumbers ?? (b.seatNumber ? [b.seatNumber] : undefined),
      status: status || 'CONFIRMED',
      bookingDate: b.bookingDate,
      totalPrice: b.totalPrice,
      passengerDetails: b.passengerDetails,
      trip
    } as BookingDTO;
  }
} 