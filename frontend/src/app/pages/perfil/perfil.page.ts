// perfil.page.ts
import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { NavController } from '@ionic/angular';
import { SidebarMenuComponent } from 'src/app/components/sidebar-menu/sidebar-menu.component';

interface Order {
  id: string;
  date: string;
  status: 'Entregado' | 'En camino' | 'Pendiente';
  total: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  imports: [CommonModule, FormsModule, IonicModule, SidebarMenuComponent]
})
export class PerfilPage {

  isMenuOpen: boolean = false;
  private authService = inject(AuthService);
  @ViewChild('sidebarMenuRef') sidebarMenu!: SidebarMenuComponent;
  
  // Datos de usuario
  userName = 'Juan Pérez';
  userEmail = 'juan.perez@ejemplo.com';


  // Pedidos y productos recientes
  orders: Order[] = [
    { id: '12345', date: '15/11/2024', status: 'Entregado', total: 450.00 },
    { id: '12344', date: '10/11/2024', status: 'En camino', total: 320.50 },
    { id: '12343', date: '05/11/2024', status: 'Pendiente', total: 150.00 },
  ];

  recentProducts: Product[] = [
    { id: 1, name: 'Hamburguesa Clásica', price: 89, image: 'https://via.placeholder.com/150' },
    { id: 2, name: 'Hot Dog Especial', price: 79, image: 'https://via.placeholder.com/150' },
    { id: 3, name: 'Refresco 600ml', price: 25, image: 'https://via.placeholder.com/150' }
  ];

  cart: Product[] = [];

  private router = inject(Router);
  private toast = inject(ToastController);
  private navCtrl = inject(NavController);
  // ===========================
  // Acciones del usuario
  // ===========================
  viewOrder(order: Order) {
    console.log('Ver detalles del pedido:', order);
    this.router.navigate(['/order-details', order.id]);
  }

  addToCart(product: Product) {
    this.cart.push(product);
    this.mostrarToast(`✅ "${product.name}" agregado al carrito`, 'success');
  }

  goToAddressForm() {
    console.log('Navegando a formulario de domicilio...');
    this.router.navigate(['/address-form']);
  }
  
  goBackNav() {
    this.navCtrl.back();
  }

  goToPaymentMethods() {
    console.log('Navegando a métodos de pago...');
    this.router.navigate(['/payment-methods']);
  }

  goToSettings() {
    console.log('Navegando a configuración...');
    this.router.navigate(['/settings']);
  }

  logout() {
    console.log('Cerrando sesión...');
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  // ===========================
  // Funciones auxiliares
  // ===========================
  getOrderStatusColor(status: string): string {
    switch (status) {
      case 'Entregado': return 'success';
      case 'En camino': return 'warning';
      case 'Pendiente': return 'danger';
      default: return 'medium';
    }
  }

  getCartCount(): number {
    return this.cart.length;
  }

  async mostrarToast(msg: string, color: 'success' | 'warning' | 'danger') {
    const t = await this.toast.create({
      message: msg,
      duration: 2500,
      color
    });
    await t.present();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.sidebarMenu) {
      this.sidebarMenu.toggleMenu();
    }
  }

}
