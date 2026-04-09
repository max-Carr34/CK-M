import { Component } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    IonicModule,
    RouterModule 
  ]
})
export class RegistroPage {

  usuario = {
    nombre: '',
    correo: '',
    password: ''
  };

  API_URL = 'http://localhost:3000/api/usuarios';

  constructor(
    private http: HttpClient,
    private toastCtrl: ToastController,
    private router: Router
  ) {}

  async registrarUsuario() {

    // Validación
    if (!this.usuario.nombre || !this.usuario.correo || !this.usuario.password) {
      const toast = await this.toastCtrl.create({
        message: 'Todos los campos son obligatorios',
        duration: 3000,
        color: 'warning'
      });
      return toast.present();
    }

    console.log('Datos a enviar:', this.usuario);

    this.http.post<any>(this.API_URL, this.usuario).subscribe({
      next: async (res) => {
        console.log('Registro exitoso:', res);

        // VALIDAR QUE VENGAN TOKENS
        if (!res || !res.accessToken) {
          const toast = await this.toastCtrl.create({
            message: '❌ Error al iniciar sesión automática',
            duration: 2500,
            color: 'danger'
          });
          return toast.present();
        }

        // GUARDAR SESIÓN AUTOMÁTICAMENTE
        localStorage.setItem('token', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
        localStorage.setItem('usuario', JSON.stringify(res.usuario));

        // TOAST
        const toast = await this.toastCtrl.create({
          message: 'Registro exitoso 🎉',
          duration: 2000,
          color: 'success'
        });
        await toast.present();

        // REDIRECCIÓN DIRECTA (YA LOGUEADO)
        this.router.navigate(['/init']);
      },

      error: async (err) => {
        console.error('Error al registrar:', err);

        const toast = await this.toastCtrl.create({
          message: 'Error al registrar: ' + (err.error?.message || err.message),
          duration: 3000,
          color: 'danger'
        });
        toast.present();
      }
    });
  }

  volverLogin() {
    this.router.navigate(['/login']);
  }

  volverInicio() {
    this.router.navigate(['/home']);
  }
}