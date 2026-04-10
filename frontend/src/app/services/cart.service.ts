import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cart: CartItem[] = [];

  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  cart$ = this.cartSubject.asObservable();

  constructor() {
    const data = localStorage.getItem('cart');
    this.cart = data ? JSON.parse(data) : [];

    // 🔥 emitir copia SIEMPRE
    this.cartSubject.next([...this.cart]);
  }

  // 🔥 método central (NO LO ROMPAS)
  private updateCart() {
    this.cart = [...this.cart]; // 👈 fuerza nueva referencia
    localStorage.setItem('cart', JSON.stringify(this.cart));
    this.cartSubject.next([...this.cart]); // 👈 clave para Angular
  }

  getCart() {
    return [...this.cart];
  }

  updateQuantity(id: number, quantity: number) {
    const item = this.cart.find(p => p.id === id);

    if (!item) return;

    if (quantity <= 0) {
      this.removeFromCart(id);
      return;
    }

    item.quantity = quantity;

    this.updateCart();
  }

  addToCart(product: any) {
    const existing = this.cart.find(item => item.id === product.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      this.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image || null,
        quantity: 1
      });
    }

    this.updateCart();
  }

  removeFromCart(id: number) {
    this.cart = this.cart.filter(item => item.id !== id);
    this.updateCart();
  }

  clearCart() {
    this.cart = [];

    // 🔥 MUY IMPORTANTE: limpiar bien todo
    localStorage.setItem('cart', JSON.stringify(this.cart));
    this.cartSubject.next([]);
  }

  getTotalItems() {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalPrice() {
    return this.cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }
}