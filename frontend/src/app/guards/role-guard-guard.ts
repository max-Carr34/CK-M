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
    const role = this.auth.getUserRole();

    // ✅ SOLO ADMIN PUEDE PASAR
    if (role === 'admin') {
      return true;
    }

    // ❌ CUALQUIER OTRO ROL ES BLOQUEADO
    this.router.navigate(['/error/403']); 
    return false;
  }
}
