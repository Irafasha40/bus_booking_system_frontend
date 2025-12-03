import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TripDTO } from '../core/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TripService {
  private apiUrl = `${environment.apiUrl}/api/trips`;

  constructor(private http: HttpClient) {}

  // Get trips with optional filters
  getTrips(filters?: { origin?: string; destination?: string; departureDate?: string }): Observable<TripDTO[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.origin) params = params.set('origin', filters.origin);
      if (filters.destination) params = params.set('destination', filters.destination);
      if (filters.departureDate) params = params.set('departureDate', filters.departureDate);
    }

    return this.http.get<unknown>(this.apiUrl, { params }).pipe(
      map((res: any) => Array.isArray(res) ? res as TripDTO[] : (res?.data ?? [] as TripDTO[]))
    );
  }

  // Get all trips (including cancelled) - for admin
  // Uses the same endpoint as getTrips since the backend should return all trips
  getAllTrips(): Observable<TripDTO[]> {
    return this.http.get<unknown>(this.apiUrl).pipe(
      map((res: any) => Array.isArray(res) ? res as TripDTO[] : (res?.data ?? [] as TripDTO[]))
    );
  }

  // Get departed trips only - for admin
  getDepartedTrips(): Observable<TripDTO[]> {
    return this.http.get<unknown>(`${this.apiUrl}/departed`).pipe(
      map((res: any) => Array.isArray(res) ? res as TripDTO[] : (res?.data ?? [] as TripDTO[]))
    );
  }

  // Create a new trip
  createTrip(data: TripDTO): Observable<TripDTO> {
    return this.http.post<TripDTO>(this.apiUrl, data);
  }

  // Cancel a trip (admin only)
  cancelTrip(tripId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${tripId}`);
  }

  // Get trip by ID
  getTripById(tripId: number): Observable<TripDTO> {
    const url = `${this.apiUrl}/${tripId}?_=${Date.now()}`; // cache-bust
    return this.http.get<unknown>(url).pipe(
      map((raw: any) => (raw && !raw.id && raw.data) ? raw.data as TripDTO : raw as TripDTO),
      map((trip: any) => this.normalizeTrip(trip))
    );
  }

  // Update trip details
  updateTrip(tripId: number, data: TripDTO): Observable<TripDTO> {
    return this.http.put<TripDTO>(`${this.apiUrl}/${tripId}`, data);
  }

  // Delete trip (admin only)
  deleteTrip(tripId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${tripId}`);
  }

  private normalizeTrip(trip: any): TripDTO {
    if (!trip) return trip as TripDTO;

    // Normalize booked seats from various possible field names
    const bookedSeats = trip.bookedSeats 
      ?? trip.bookedSeatNumbers 
      ?? trip.seatsBooked 
      ?? trip.booked;

    if (bookedSeats && !Array.isArray(bookedSeats)) {
      trip.bookedSeats = [String(bookedSeats)];
    } else if (Array.isArray(bookedSeats)) {
      trip.bookedSeats = bookedSeats.map((s: any) => String(s));
    } else {
      trip.bookedSeats = [];
    }

    return trip as TripDTO;
  }
}
