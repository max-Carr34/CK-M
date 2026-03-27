import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButton,
  IonItem,
  IonIcon,
  IonLabel,
  IonInput,
  ToastController
} from '@ionic/angular/standalone';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-changepassw',
  templateUrl: './changepassw.page.html',
  styleUrls: ['./changepassw.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButton,
    IonItem,
    IonIcon,
    IonLabel,
    IonInput
  ]
})
export class ChangepasswPage implements OnInit {

  newPassword = '';
  confirmPassword = '';
  token = ''; // 🔥 IMPORTANTE

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastCtrl: ToastController,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // 🔥 Obtener token de la URL
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  async onChangePassword() {

    if (!this.newPassword || !this.confirmPassword) {
      return this.showToast('Todos los campos son obligatorios', 'warning');
    }

    if (this.newPassword !== this.confirmPassword) {
      return this.showToast('Las contraseñas no coinciden', 'danger');
    }

    if (!this.token) {
      return this.showToast('Token inválido o ausente', 'danger');
    }

    this.http.post('http://localhost:3000/reset-password', {
      token: this.token,
      newPassword: this.newPassword
    }).subscribe({
      next: async () => {
        await this.showToast('Contraseña actualizada 🎉', 'success');

        this.newPassword = '';
        this.confirmPassword = '';

        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: async (err) => {
        await this.showToast(
          err.error?.message || 'Token inválido o expirado',
          'danger'
        );
      }
    });
  }

  async cancel() {
    await this.showToast('Volviendo al login', 'medium');
    this.router.navigate(['/login']);
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color
    });
    await toast.present();
  }
}