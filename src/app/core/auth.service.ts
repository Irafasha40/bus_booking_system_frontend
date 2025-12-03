import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {AuthResponse, LoginDTO, RegisterDTO, ResetDTO, UserDTO} from './models';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private currentUser = new BehaviorSubject<AuthResponse | null>(null);
  public user$ = this.currentUser.asObservable();

  constructor(private http: HttpClient) {}

  login(data: LoginDTO): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signin`, data);
  }

  register(data: RegisterDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, data);
  }

  resetPassword(email: string, otp: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, {
      email,
      otp,
      newPassword
    });
  }
  
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  saveToken(token: string): void {
    localStorage.setItem('jwt', token);
  }

  getToken(): string | null {
    return localStorage.getItem('jwt');
  }

  decodeToken(token: string): any {
    try {
      return jwtDecode(token);
    } catch (error) {
      return null;
    }
  }

  getCurrentUser(): UserDTO | null {
    const token = this.getToken();
    if (!token) return null;

    const decoded: any = this.decodeToken(token);
    if (!decoded) return null;

    const idCandidate = decoded.id ?? decoded.userId ?? decoded.user_id ?? decoded.sub;
    const roleCandidate = decoded.role ?? decoded.roles ?? (Array.isArray(decoded.authorities) ? decoded.authorities[0] : undefined);

    if (!idCandidate) return null;

    return {
      id: Number(idCandidate),
      username: decoded.username ?? decoded.name ?? '',
      email: decoded.email ?? '',
      role: roleCandidate ?? ''
    } as UserDTO;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    const decoded = this.decodeToken(token);
    if (!decoded) return false;
    
    // Check if token is expired
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'ADMIN';
  }

  logout(): void {
    localStorage.removeItem('jwt');
    this.currentUser.next(null);
  }
}
