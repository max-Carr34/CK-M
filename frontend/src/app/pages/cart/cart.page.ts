import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CartItem, CartService } from '../../services/cart.service';
import { AlertController, ToastController, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class CartPage implements OnInit, OnDestroy {

  cartItems: CartItem[] = [];
  totalItems = 0;
  totalPrice = 0;

  private cartSub!: Subscription;
  isCheckingOut = false;

  constructor(
    private cartService: CartService,
    private alertController: AlertController,
    private toastController: ToastController,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    this.cartSub = this.cartService.cart$.subscribe((items: CartItem[]) => {
      this.cartItems = [...items];
      this.totalItems = this.cartService.getTotalItems();
      this.totalPrice = this.cartService.getTotalPrice();
    });
  }

  ngOnDestroy() {
    this.cartSub?.unsubscribe();
  }

  get isEmpty(): boolean {
    return this.cartItems.length === 0;
  }

  // 🔼 Aumentar cantidad
  increaseQuantity(item: CartItem) {
    this.cartService.updateQuantity(item.id, item.quantity + 1);
  }

  // 🔽 Disminuir cantidad
  decreaseQuantity(item: CartItem) {
    this.cartService.updateQuantity(item.id, item.quantity - 1);
  }

  goToMenu() {
    this.navCtrl.navigateForward('/menu');
  }

  // ❌ Eliminar producto
  async removeItem(id: number) {
    const alert = await this.alertController.create({
      header: 'Eliminar producto',
      message: '¿Deseas quitar este producto del carrito?',
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-cancel'
        },
        {
          text: 'Eliminar',
          cssClass: 'alert-confirm',
          handler: () => {
            this.cartService.removeFromCart(id);
            this.showToast('Producto eliminado del carrito', 'trash-outline');
          }
        }
      ]
    });

    await alert.present();
  }

  // 🧹 Vaciar carrito
  async clearCart() {
    if (this.isEmpty) return;

    const alert = await this.alertController.create({
      header: 'Vaciar carrito',
      message: '¿Estás seguro de que deseas eliminar todos los productos?',
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-cancel'
        },
        {
          text: 'Vaciar',
          cssClass: 'alert-confirm',
          handler: () => {
            this.cartService.clearCart();
            this.showToast('Carrito vaciado', 'cart-outline');
          }
        }
      ]
    });

    await alert.present();
  }

  // 💳 Checkout (CORREGIDO)
  checkout() {
    if (this.isEmpty || this.isCheckingOut) return;

    this.isCheckingOut = true;

    // 🔥 Solo navegación (NO backend aquí)
    setTimeout(() => {
      this.navCtrl.navigateForward('/pag-pago');
      this.isCheckingOut = false;
    }, 500);
  }

  // 🔁 trackBy
  trackById(_: number, item: CartItem): number {
    return item.id;
  }

  // 💰 Subtotal
  getItemSubtotal(item: CartItem): number {
    return item.price * item.quantity;
  }

  // 🔔 Toast
  private async showToast(message: string, icon: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      icon,
      cssClass: 'custom-toast'
    });

    await toast.present();
  }
}