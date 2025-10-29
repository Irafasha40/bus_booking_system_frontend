import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './request-reset.component.html',
  styleUrl: './request-reset.component.css'
})
export class RequestResetComponent {
  // Component properties for password reset flow
  resetForm: FormGroup;
  message = '';
  error = '';
  loading = false;
  emailSent = false;
  emailAddress = '';

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private router: Router
  ) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onSubmit(): void {
    if (!this.emailSent) {
      // Step 1: Request password reset - only validate email
      if (this.resetForm.get('email')?.invalid) return;
      
      this.loading = true;
      this.message = '';
      this.error = '';

      this.authService.requestPasswordReset(this.resetForm.value.email).subscribe({
        next: () => {
          this.message = '✅ OTP sent to your email. Please check your inbox and enter the code below.';
          this.emailSent = true;
          this.emailAddress = this.resetForm.value.email;
          this.loading = false;
        },
        error: () => {
          this.error = '❌ Failed to send OTP. Please try again.';
          this.loading = false;
        }
      });
    } else {
      // Step 2: Reset password with OTP - validate all fields
      if (this.resetForm.invalid) return;
      
      this.loading = true;
      this.message = '';
      this.error = '';

      const { email, otp, newPassword } = this.resetForm.value;
      this.authService.resetPassword(email, otp, newPassword).subscribe({
        next: () => {
          this.message = '✅ Password reset successfully! Redirecting to login...';
          this.loading = false;
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: () => {
          this.error = '❌ Failed to reset password. Please check your OTP and try again.';
          this.loading = false;
        }
      });
    }
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }

  resetFormData(): void {
    this.emailSent = false;
    this.message = '';
    this.error = '';
    this.resetForm.reset();
  }
}
