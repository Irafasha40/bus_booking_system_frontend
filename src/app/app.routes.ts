import { Routes } from '@angular/router';
import { RequestResetComponent } from './auth/password-reset/request-reset.component';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { HomeComponent } from './home/home.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard/admin-dashboard.component';
import { UserDashboardComponent } from './dashboard/user-dashboard/user-dashboard.component';
import { TripListComponent } from './trips/trip-list/trip-list.component';
import { CreateTripComponent } from './trips/trip-create/trip-create.component';
import { SeatSelection } from './booking/seat-selection/seat-selection';
import { BookingHistory } from './booking/booking-history/booking-history';
import { AdminGuard } from './core/admin-guard';
import { AuthGuard } from './core/auth-guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'forgot-password', component: RequestResetComponent },
  { path: 'dashboard', component: UserDashboardComponent, canActivate: [AuthGuard] },
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [AdminGuard] },
  { path: 'trips', component: TripListComponent, canActivate: [AuthGuard] },
  { path: 'create-trip', component: CreateTripComponent, canActivate: [AdminGuard] },
  { path: 'seat-selection', component: SeatSelection, canActivate: [AuthGuard] },
  { path: 'booking-history', component: BookingHistory, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/' } // fallback to home
];
