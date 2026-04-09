import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [CommonModule, FormsModule, IonicModule]
})
export class LoginPage {

  correo = '';
  password = '';

  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastController);

  onLogin() {
    // ✅ Validación de campos vacíos
    if (!this.correo.trim() || !this.password.trim()) {
      this.mostrarToast('⚠️ Datos incompletos', 'warning');
      return;
    }

    // ✅ Llamada al servicio
    this.auth.login(this.correo, this.password).subscribe({
      next: (res) => {

        //CAMBIO IMPORTANTE: ahora usamos accessToken
        if (!res || !res.accessToken) {
          this.mostrarToast('❌ Credenciales inválidas', 'danger');
          return;
        }

        //GUARDAR TOKENS
        localStorage.setItem('token', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
        localStorage.setItem('usuario', JSON.stringify(res.usuario));

        console.log('✅ TOKEN GUARDADO:', localStorage.getItem('token'));

        // 🔥 Rol del usuario
        const rol = res.usuario.rol.toLowerCase();
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

        // ✅ Si hay returnUrl
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
          return;
        }

        // ✅ Redirección por rol
        if (rol === 'admin') {
          this.router.navigate(['/admin-dashboard']);
        } else {
          this.router.navigate(['/init']);
        }
      },
      error: (err) => {
        console.error('❌ Error en login:', err);
        this.mostrarToast('❌ Error de servidor', 'danger');
      }
    });
  }

  recuperarCuenta() {
    this.router.navigate(['/recupass']);
  }

  irRegistro() {
    this.router.navigate(['/registro']);
  }

  volverInicio() {
    this.router.navigate(['/home']);
  }

  async mostrarToast(msg: string, color: 'success' | 'warning' | 'danger') {
    const t = await this.toast.create({
      message: msg,
      duration: 2500,
      color
    });
    await t.present();
  }
}