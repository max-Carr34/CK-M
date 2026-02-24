import { Component } from '@angular/core';
import { ToastController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-recupass',
  standalone: true,
  templateUrl: './recupass.page.html',
  styleUrls: ['./recupass.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class RecupassPage {

  email: string = '';

  constructor(
    private toastCtrl: ToastController,
    private authService: AuthService,
    private router: Router
  ) {}

  /** Enviar correo de recuperación */
  async onRecoverPassword() {
    if (!this.email.trim()) {
      await this.mostrarToast('⚠️ Ingresa tu correo', 'warning');
      return;
    }

    try {
      await this.authService.forgotPassword(this.email).toPromise();
      await this.mostrarToast('📬 Revisa tu correo para instrucciones', 'success');
      this.goBackToLogin();
    } catch (err: any) {
      console.error('❌ Error al enviar correo:', err);
      const msg = err?.error?.message || 'Error al enviar el correo. Intenta más tarde.';
      await this.mostrarToast(`❌ ${msg}`, 'danger');
    }
  }

  /** Volver al login */
  goBackToLogin() {
    this.router.navigate(['/login']);
  }

  /** Botón CANCEL */
  cancel() {
    this.router.navigate(['/login']);
  }

  /** Toast reutilizable */
  async mostrarToast(
    msg: string,
    color: 'success' | 'danger' | 'warning'
  ) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 3000,
      color,
    });

    await toast.present();
  }
}

