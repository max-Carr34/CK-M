import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, tap, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  usuario: {
    id: number;
    nombre: string;
    correo: string;
    rol: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  // ============================================
  // STATE
  // ============================================
  private userSubject = new BehaviorSubject<any | null>(this.getUser());
  user$ = this.userSubject.asObservable();

  private roleSubject = new BehaviorSubject<string | null>(this.getUserRole());
  role$ = this.roleSubject.asObservable();

  // ============================================
  // HEADERS
  // ============================================
  private getHeaders(): HttpHeaders {
    const token = this.getToken();

    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  // ============================================
  // LOGIN
  // ============================================
  login(correo: string, password: string) {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      { correo, password }
    ).pipe(
      tap(res => {
        if (res?.accessToken) {
          this.saveSession(res);
        }
      }),
      catchError(err => {
        console.error('❌ Login error:', err);
        return throwError(() => err);
      })
    );
  }

  // ============================================
  // SESSION
  // ============================================
  private saveSession(res: LoginResponse) {
    const session = {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      usuario: {
        ...res.usuario,
        rol: res.usuario.rol?.trim().toLowerCase()
      },
      expira: Date.now() + (60 * 60 * 1000)
    };

    localStorage.setItem('session', JSON.stringify(session));

    this.userSubject.next(session.usuario);
    this.roleSubject.next(session.usuario.rol);
  }

  private getSession(): any {
    const data = localStorage.getItem('session');
    return data ? JSON.parse(data) : null;
  }

  getToken(): string | null {
    return this.getSession()?.accessToken || null;
  }

  getUser(): any {
    return this.getSession()?.usuario || null;
  }

  getUserRole(): string | null {
    return this.getUser()?.rol || null;
  }

  getUserId(): number | null {
    return this.getUser()?.id || null;
  }

  // ============================================
  // ROLE HELPERS
  // ============================================
  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  isUser(): boolean {
    return this.getUserRole() === 'usuario';
  }

  hasRole(roles: string[]): boolean {
    const role = this.getUserRole() || '';
    return roles.map(r => r.toLowerCase()).includes(role);
  }

  // ============================================
  // AUTH CHECK
  // ============================================
  isAuthenticated(): boolean {
    const session = this.getSession();

    if (!session) return false;

    if (Date.now() > session.expira) {
      this.logout();
      return false;
    }

    return true;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  // ============================================
  // LOGOUT
  // ============================================
  logout() {
    const session = this.getSession();

    if (session?.refreshToken) {
      this.http.post(`${this.apiUrl}/logout`, {
        refreshToken: session.refreshToken
      }).subscribe({
        error: (err) => console.warn('Logout error:', err)
      });
    }

    localStorage.removeItem('session');

    this.userSubject.next(null);
    this.roleSubject.next(null);
  }

  // ============================================
  // REFRESH TOKEN
  // ============================================
  refreshToken() {
    const session = this.getSession();

    if (!session?.refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token'));
    }

    return this.http.post<any>(
      `${this.apiUrl}/refresh`,
      { refreshToken: session.refreshToken }
    ).pipe(
      tap(res => {
        if (res?.accessToken) {
          this.updateAccessToken(res.accessToken);
        }
      }),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  updateAccessToken(token: string) {
    const session = this.getSession();
    if (!session) return;

    session.accessToken = token;
    session.expira = Date.now() + (60 * 60 * 1000);

    localStorage.setItem('session', JSON.stringify(session));
  }

  // ===============================
  // ADMIN
  // ===============================
  getStats() {
    return this.http.get(`${this.apiUrl}/admin/stats`, {
      headers: this.getHeaders()
    });
  }

  getLogs() {
    return this.http.get(`${this.apiUrl}/admin/logs`, {
      headers: this.getHeaders()
    });
  }

  getUsers() {
    return this.http.get(`${this.apiUrl}/admin/users`, {
      headers: this.getHeaders()
    });
  }

  getSessions() {
    return this.http.get(`${this.apiUrl}/admin/sessions`, {
      headers: this.getHeaders()
    });
  }

  deleteUser(id: number) {
    return this.http.delete(`${this.apiUrl}/admin/users/${id}`, {
      headers: this.getHeaders()
    });
  }

  forceLogoutUser(id: number) {
    return this.http.post(`${this.apiUrl}/admin/force-logout/${id}`, {}, {
      headers: this.getHeaders()
    });
  }

  updateUser(id: number, correo: string) {
    return this.http.put(`${this.apiUrl}/admin/users/${id}`, {
      correo
    }, {
      headers: this.getHeaders()
    });
  }

  // ============================================
  // VERIFY SESSION
  // ============================================
  checkSession() {
    return this.http.get(`${this.apiUrl}/verify-token`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(err => {
        this.logout();
        return of(null);
      })
    );
  }

  // ============================================
  // PASSWORD RESET
  // ============================================
  forgotPassword(correo: string) {
    return this.http.post(`${this.apiUrl}/request-reset-password`, {
      correo
    });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post(
      `${this.apiUrl}/reset-password`,
      { token, newPassword }
    );
  }
}