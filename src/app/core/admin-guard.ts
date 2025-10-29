import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const token = this.auth.getToken();
    const isAdmin = this.auth.isAdmin();

    if (!token || !isAdmin) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
} 