import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, tap, of } from 'rxjs';
import { environment } from '../../environments/environment';

interface LoginResponse {
  token: string;
  usuario: { id: number; nombre: string; correo: string; rol: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  /** ✅ Rol reactivo */
  private roleSubject = new BehaviorSubject<string | null>(this.getUserRole());
  role$ = this.roleSubject.asObservable();

  /** ✅ Headers */
  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return new HttpHeaders(headers);
  }

  /** ✅ Login */
  login(correo: string, password: string) {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      { correo, password },
    ).pipe(
      tap(res => {
        if (res?.token) {
          this.saveToken(res.token);
          this.saveUser(res.usuario);
          this.roleSubject.next(res.usuario.rol.trim().toLowerCase());
        }
      }),
      catchError(err => {
        console.error('❌ Error en login:', err);
        return of(null);
      })
    );
  }

  saveToken(token: string) {
    if (token) localStorage.setItem('token', token);
  }

  saveUser(usuario: any) {
    if (usuario && usuario.rol) {
      usuario.rol = usuario.rol.trim().toLowerCase();
      localStorage.setItem('usuario', JSON.stringify(usuario));
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): any | null {
    const user = localStorage.getItem('usuario');
    return user ? JSON.parse(user) : null;
  }

  getUserId(): number | null {
    return this.getUser()?.id || null;
  }

  getUserRole(): string | null {
    return this.getUser()?.rol?.trim().toLowerCase() || null;
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  isUser(): boolean {
    return this.getUserRole() === 'user';
  }

   // Verifica si hay token Y usuario
  isAuthenticated(): boolean {
  return !!this.getToken() && !!this.getUser();
  }
  isLoggedIn(): boolean {
  return this.isAuthenticated();
 }

  hasRole(roles: string[]): boolean {
    const userRole = this.getUserRole() || '';
    return roles.some(role => role.trim().toLowerCase() === userRole);
  }

  // LOGOUT
  logout() {
    const refreshToken = localStorage.getItem('refreshToken');

    // Llamada al backend para invalidar sesión
    if (refreshToken) {
      this.http.post('http://localhost:3000/logout', { refreshToken })
        .subscribe({
          next: () => console.log('✅ Logout backend OK'),
          error: (err) => console.error('❌ Error logout backend:', err)
        });
    }
    // LIMPIA TODO
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('usuario');

    // Resetear rol
    this.roleSubject.next(null);
  }

  forgotPassword(email: string) {
  return this.http.post('http://localhost:3000/api/request-reset-password', {
    correo: email
  });
  }
  refreshToken() {
  return this.http.post<any>('http://localhost:3000/refresh', {
    refreshToken: localStorage.getItem('refreshToken')
  });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/reset-password`,
      { token, newPassword },
      { headers: this.getHeaders() }
    );
  }
}
