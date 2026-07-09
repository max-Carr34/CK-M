import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [] // Agrega CommonModule si usas *ngIf o *ngFor
})
export class FooterComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  // Métodos de navegación
  goToHome(): void {
    this.router.navigate(['/init']);
  }

  goToMenu(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/menu']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  goToTerms(): void {
    this.router.navigate(['/terminos']);
  }

  // Método auxiliar para verificar autenticación (opcional, si quieres mostrar icono 🔒)
  isUserAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
} 