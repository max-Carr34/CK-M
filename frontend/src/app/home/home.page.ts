import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { addIcons } from 'ionicons';
import {
  cartOutline,
  menuOutline,
  arrowForward,
  callOutline,
  locationOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonButton,
  ]
})
export class HomePage implements OnInit {

  constructor(private router: Router, private auth: AuthService) {
    addIcons({
      'cart-outline': cartOutline,
      'menu-outline': menuOutline,
      'arrow-forward': arrowForward,
      'call-outline': callOutline,
      'location-outline': locationOutline
    });
  }

  ngOnInit() {}

  // Función para el logo (añadir esta)
  goHome() {
    console.log('Navegando al inicio...');
    this.router.navigate(['/home']);
  }

  iniciarSesion() {
    console.log('Navegando a la página de Login...');
    this.router.navigate(['/login']);
  }
  
  abrirRegistro() {
    console.log('Navegando a la página de Registro...');
    this.router.navigate(['/registro']);
  }

  // Ir al menú: requiere login. Si no está autenticado, redirige a /login con returnUrl
  handleMenu() {
    const target = '/menu';
    if (this.auth.isAuthenticated()) {
      this.router.navigate([target]);
    } else {
      this.router.navigate(['/login'], { queryParams: { returnUrl: target } });
    }
  }
}