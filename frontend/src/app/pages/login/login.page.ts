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
    // Validación de campos vacíos
    if (!this.correo.trim() || !this.password.trim()) {
      // Si marca error alerta de warning
      this.mostrarToast('⚠️ Datos incompletos', 'warning');
      return;
    }

    // Llamada al servicio de login
    this.auth.login(this.correo, this.password).subscribe({
      next: (res) => {
        // Si la respuesta no tiene token, alerta de danger
        if (!res || !res.token) {
          this.mostrarToast('❌ Credenciales inválidas', 'danger');
          return;
        }

        // Token guardado correctamente
        console.log('✅ TOKEN GUARDADO:', localStorage.getItem('token'));

        // Determina el rol del usuario y la ruta de navegación
        const rol = res.usuario.rol.toLowerCase();
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

        // Si hay returnUrl, navega ahí
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
          return;
        }

        // Si el rol es admin, navega al dashboard; si no, a init
        if (rol === 'admin') {
          this.router.navigate(['/admin-dashboard']);
        } else {
          this.router.navigate(['/init']);
        }
      },
      error: (err) => {
        // Si marca error alerta de danger
        console.error('❌ Error en login:', err);
        this.mostrarToast('❌ Error de servidor', 'danger');
      }
    });
  }

  // ✅ AHORA SOLO NAVEGA A RECUPASS (NO MODAL)
  recuperarCuenta() {
    console.log('➡️ Navegando a recupass...');
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
