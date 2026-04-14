import { Component, inject, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { NavController } from '@ionic/angular';
import { SidebarMenuComponent } from 'src/app/components/sidebar-menu/sidebar-menu.component';
import { Subscription } from 'rxjs';
import { OrderService } from 'src/app/services/order.service';
import { CartService } from 'src/app/services/cart.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  imports: [CommonModule, FormsModule, IonicModule, SidebarMenuComponent]
})
export class PerfilPage implements OnInit, OnDestroy {

  isMenuOpen: boolean = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastController);
  private navCtrl = inject(NavController);
  private orderService = inject(OrderService);
  private cartService = inject(CartService);

  @ViewChild('sidebarMenuRef') sidebarMenu!: SidebarMenuComponent;

  private userSub!: Subscription;
  private cartSub!: Subscription;

  userName: string = '';
  userEmail: string = '';
  orders: any[] = [];
  cartCount: number = 0;
  recentProducts: any[] = [];

  // ============================================
  // INIT
  // ============================================
  ngOnInit() {
    this.loadUser();
    this.loadCart();
    this.loadRecentProducts();
  }

  ngOnDestroy() {
    if (this.userSub) this.userSub.unsubscribe();
    if (this.cartSub) this.cartSub.unsubscribe();
  }

  // ============================================
  // USUARIO + PEDIDOS
  // ============================================
  loadUser() {
    this.userSub = this.authService.user$.subscribe(user => {
      if (user) {
        this.userName = user.nombre;
        this.userEmail = user.correo;

        // 🔥 cargar pedidos reales
        this.loadOrders(user.id);
      }
    });
  }

  loadOrders(userId: number) {
    this.orderService.getOrdersByUser(userId).subscribe({
      next: (data) => {
        this.orders = data;
      },
      error: (err) => {
        console.error('❌ Error cargando pedidos:', err);
      }
    });
  }

  // ============================================
  // CARRITO (REACTIVO)
  // ============================================
  loadCart() {
    this.cartSub = this.cartService.cart$.subscribe(cart => {
      this.cartCount = cart.length;
    });
  }

  addToCart(product: any) {
    this.cartService.addToCart(product); // 🔥 CORRECTO
    this.mostrarToast(`"${product.name}" agregado`, 'success');
  }

  // ============================================
  // ACCIONES
  // ============================================
  viewOrder(order: any) {
    this.router.navigate(['/order-details', order.id]);
  }

  goToAddressForm() {
    this.router.navigate(['/address-form']);
  }

  goToPaymentMethods() {
    this.router.navigate(['/payment-methods']);
  }

  goToSettings() {
    this.router.navigate(['/settings']);
  }

  logout() {
    this.authService.logout();
    this.navCtrl.navigateRoot('/login');
  }

  // ============================================
  // UI
  // ============================================
  async mostrarToast(msg: string, color: 'success' | 'warning' | 'danger') {
    const t = await this.toast.create({
      message: msg,
      duration: 2000,
      color
    });
    await t.present();
  }
  loadRecentProducts() {
  // 🔥 temporal (luego puedes traerlo del backend)
  this.recentProducts = [
    { id: 1, name: 'Hamburguesa Clásica', price: 89, image: 'https://via.placeholder.com/150' },
    { id: 2, name: 'Hot Dog Especial', price: 79, image: 'https://via.placeholder.com/150' }
  ];
}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.sidebarMenu?.toggleMenu();
  }
}