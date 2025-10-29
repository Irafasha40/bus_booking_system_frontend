import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
	const authService = inject(AuthService);
	const token = authService.getToken();
	const isLoggedIn = authService.isLoggedIn();
	const isApiRequest = req.url.startsWith('http://localhost:8080');
	
	// Skip adding Authorization header for authentication endpoints
	const isAuthEndpoint = req.url.includes('/api/auth/signin') || 
						  req.url.includes('/api/auth/signup') || 
						  req.url.includes('/api/auth/forgot-password') ||
						  req.url.includes('/api/auth/reset-password');

	if (isLoggedIn && token && isApiRequest && !isAuthEndpoint) {
		const authReq = req.clone({
			setHeaders: { Authorization: `Bearer ${token}` }
		});
		return next(authReq);
	}

	return next(req);
};
