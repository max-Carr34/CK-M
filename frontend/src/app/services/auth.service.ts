import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, tap, of , throwError} from 'rxjs';
import { environment } from '../../environments/environment';

interface LoginResponse {
  mensaje: string;
  accessToken: string;
  refreshToken: string;
  usuario: {
    id: number;
    nombre: string;
    correo: string;
    rol: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  /** 🔥 Estado reactivo del rol */
  private roleSubject = new BehaviorSubject<string | null>(this.getUserRole());
  role$ = this.roleSubject.asObservable();

  /** 🔐 Headers con token */
  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return new HttpHeaders(headers);
  }

  /** 🔑 LOGIN */
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
        console.error('❌ Error en login:', err);
        return of(null);
      })
    );
  }

  /** 💾 Guardar sesión completa */
  private saveSession(res: LoginResponse) {
    const session = {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      usuario: {
        ...res.usuario,
        rol: res.usuario.rol.trim().toLowerCase()
      },
      // ⏱️ Expira en 1 hora
      expira: Date.now() + (60 * 60 * 1000)
    };

    localStorage.setItem('session', JSON.stringify(session));
    this.roleSubject.next(session.usuario.rol);
  }

  /** 🔍 Obtener sesión */
  private getSession(): any | null {
    const data = localStorage.getItem('session');
    return data ? JSON.parse(data) : null;
  }

  /** 🔐 TOKEN */
  getToken(): string | null {
    return this.getSession()?.accessToken || null;
  }

  /** 👤 USUARIO */
  getUser(): any | null {
    return this.getSession()?.usuario || null;
  }

  getUserId(): number | null {
    return this.getUser()?.id || null;
  }

  /** 🎭 ROLES */
  getUserRole(): string | null {
    return this.getUser()?.rol || null;
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  isUser(): boolean {
    return this.getUserRole() === 'user';
  }

  hasRole(roles: string[]): boolean {
    const userRole = this.getUserRole() || '';
    return roles.some(r => r.trim().toLowerCase() === userRole);
  }

  /** ✅ AUTH */
  isAuthenticated(): boolean {
    const session = this.getSession();

    if (!session) return false;

    // ⏱️ Validar expiración
    if (Date.now() > session.expira) {
      this.logout();
      return false;
    }

    return true;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  /** 🔄 Verificar sesión con backend */
  checkSession() {
    return this.http.get(`${this.apiUrl}/verify-token`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(err => {
        console.warn('⚠️ Sesión inválida');
        this.logout();
        return of(null);
      })
    );
  }

  /** 🔁 REFRESH TOKEN */
  refreshToken() {
  const refreshToken = this.getSession()?.refreshToken;

  if (!refreshToken) {
    this.logout();
    return throwError(() => new Error('No refresh token'));
  }

  return this.http.post<any>(
    `${this.apiUrl}/refresh`,
    { refreshToken }
  ).pipe(
    tap(res => {
      if (res?.accessToken) {
        this.updateAccessToken(res.accessToken);
      }
    }),
    catchError(err => {
      console.error('❌ Error refresh token');
      this.logout();
      return throwError(() => err); // 🔥 YA NO devuelve null
    })
  );
}

  /** 🚪 LOGOUT */
  logout() {
    const refreshToken = this.getSession()?.refreshToken;

    if (refreshToken) {
      this.http.post(`${this.apiUrl}/logout`, { refreshToken })
        .subscribe({
          next: () => console.log('✅ Logout backend'),
          error: () => console.warn('⚠️ Error backend logout')
        });
    }

    // 🧹 LIMPIEZA TOTAL
    localStorage.removeItem('session');

    this.roleSubject.next(null);
  }

  /** 🔁 RESET PASSWORD */
  forgotPassword(email: string) {
    return this.http.post(`${this.apiUrl}/request-reset-password`, {
      correo: email
    });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post(
      `${this.apiUrl}/reset-password`,
      { token, newPassword },
      { headers: this.getHeaders() }
    );
  }
  updateAccessToken(newToken: string) {
  const session = this.getSession();
  if (!session) return;

  session.accessToken = newToken;
  session.expira = Date.now() + (60 * 60 * 1000);

  localStorage.setItem('session', JSON.stringify(session));
}
}
