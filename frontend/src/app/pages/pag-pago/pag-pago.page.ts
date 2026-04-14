import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import * as i from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  homeOutline, cafeOutline, cardOutline, layersOutline, 
  cashOutline, documentTextOutline, copyOutline, cameraOutline,
  locationOutline, swapHorizontalOutline, checkmarkCircleOutline,
  receiptOutline, cloudUploadOutline
} from 'ionicons/icons';

import { CartService, CartItem } from '../../services/cart.service';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pag-pago',
  templateUrl: './pag-pago.page.html',
  styleUrls: ['./pag-pago.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ...[
    i.IonContent, i.IonHeader, i.IonTitle, i.IonToolbar, i.IonButtons, 
    i.IonBackButton, i.IonLabel, i.IonItem, i.IonIcon, i.IonRadio, 
    i.IonRadioGroup, i.IonButton, i.IonList, i.IonNote, i.IonFooter, i.IonSpinner
  ]]
})
export class PagPagoPage implements OnInit, OnDestroy {

  paymentMethod: string = '';
  cartItems: CartItem[] = [];
  totalPrice: number = 0;
  selectedFile: File | null = null;

  private cartSub!: Subscription;

  private cartService = inject(CartService);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);
  private loadingCtrl = inject(i.LoadingController);
  private toastCtrl = inject(i.ToastController);

  constructor() {
    addIcons({ 
      homeOutline, cafeOutline, cardOutline, layersOutline, 
      cashOutline, documentTextOutline, copyOutline, cameraOutline,
      locationOutline, swapHorizontalOutline, checkmarkCircleOutline,
      receiptOutline, cloudUploadOutline
    });
  }

  ngOnInit() {
    this.cartSub = this.cartService.cart$.subscribe((items: CartItem[]) => {
      this.cartItems = [...items];
      this.totalPrice = this.cartService.getTotalPrice();
    });
  }

  ngOnDestroy() {
    this.cartSub?.unsubscribe();
  }

  // 📎 archivo comprobante
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.presentToast(`Archivo seleccionado: ${file.name}`);
    }
  }

  // 📋 copiar CLABE
  copyClabe() {
    navigator.clipboard.writeText('002180001234567890');
    this.presentToast('CLABE copiada');
  }

  // 🔥 CONFIRMAR PEDIDO
  async confirmOrder() {

    if (!this.paymentMethod) {
      this.presentToast('Selecciona un método de pago');
      return;
    }

    if (this.paymentMethod === 'spei' && !this.selectedFile) {
      this.presentToast('Adjunta comprobante');
      return;
    }

    const cart = this.cartService.getCart();
    const userId = this.authService.getUserId();

    console.log('USER ID:', userId);
    console.log('CART:', cart);
    console.log('TOTAL:', this.totalPrice);

    if (!cart.length) {
      this.presentToast('Carrito vacío');
      return;
    }

    if (!userId) {
      this.presentToast('Usuario no autenticado');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Generando pedido...'
    });

    await loading.present();

    const data = {
      user_id: userId,
      cart: cart
    };

    this.http.post('http://localhost:3000/api/orders', data).subscribe({
      next: async (res: any) => {
        await loading.dismiss();

        console.log('✅ PEDIDO:', res);

        // 🧹 limpiar carrito
        this.cartService.clearCart();

        await this.presentToast('Pedido generado');

        // 🔥 🔥 🔥 FIX DEFINITIVO
        this.router.navigate(['/success'], {
          queryParams: {
            orderId: res.orderId,
            total: this.totalPrice,
            method: this.paymentMethod
          }
        });

      },
      error: async (err) => {
        await loading.dismiss();
        console.error('❌ ERROR:', err);
        this.presentToast('Error al generar pedido');
      }
    });
  }

  async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }
}