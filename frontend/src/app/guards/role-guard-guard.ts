import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
  const isLogged = this.auth.isLoggedIn();
  const role = this.auth.getUserRole();

  if (!isLogged) {
    this.router.navigate(['/login']);
    return false;
  }

  if (role === 'admin') {
    return true;
  }

  this.router.navigate(['/error/403']);
  return false;
  }
}
