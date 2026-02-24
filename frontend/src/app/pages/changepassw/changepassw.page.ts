import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { Router } from '@angular/router';

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
export class ChangepasswPage {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  constructor(
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  async onChangePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      return (await this.toastCtrl.create({
        message: 'Todos los campos son obligatorios',
        duration: 3000,
        color: 'warning'
      })).present();
    }

    if (this.newPassword !== this.confirmPassword) {
      return (await this.toastCtrl.create({
        message: 'Las contraseñas no coinciden',
        duration: 3000,
        color: 'danger'
      })).present();
    }

    if (this.currentPassword === this.newPassword) {
      return (await this.toastCtrl.create({
        message: 'La nueva contraseña debe ser diferente a la actual',
        duration: 3000,
        color: 'warning'
      })).present();
    }

    console.log('Cambio de contraseña:', {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    });

    (await this.toastCtrl.create({
      message: 'Contraseña cambiada exitosamente 🎉',
      duration: 2000,
      color: 'success'
    })).present();

    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';

    setTimeout(() => this.router.navigate(['/perfil']), 2000);
  }

  async cancel() {
    (await this.toastCtrl.create({
      message: 'Volviendo al Inicio',
      duration: 1500,
      color: 'medium'
    })).present();

    this.router.navigate(['/home']);
  }
}
