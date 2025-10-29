export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface ResetDTO {
  email: string;
  otp: string;
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export interface TripDTO {
  id?: number;
  tripId?: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  totalSeats: number;
  busNumber: string;
  status?: 'ACTIVE' | 'CANCELLED';
  availableSeats?: number;
  bookedSeats?: string[];
}

export interface PassengerDetail {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  seatNumber: string | number;
}

export interface CreateBookingRequest {
  tripId: number | string;
  seatNumbers: string[];
  passengerDetails: PassengerDetail[];
}

export interface BookingDTO {
  id?: number;
  bookingId?: string;
  tripId: number | string;
  userId?: number | string;
  seatNumber?: string;
  seatNumbers?: string[];
  status: 'CONFIRMED' | 'CANCELLED' | string;
  bookingDate?: string;
  totalPrice?: number;
  passengerDetails?: PassengerDetail[];
  trip?: TripDTO;
}

export interface UserDTO {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface SeatDTO {
  seatNumber: string;
  isBooked: boolean;
  bookingId?: number | string;
}
