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
    this.loadCart();
  }

  // ============================================
  // LOAD CART (FIX IMPORTANTE)
  // ============================================
  private loadCart() {
    try {
      const data = localStorage.getItem('cart');
      this.cart = data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Cart load error:', e);
      this.cart = [];
      localStorage.removeItem('cart');
    }

    this.emitCart();
  }

  // ============================================
  // CENTRAL UPDATE
  // ============================================
  private updateCart() {
    this.saveCart();
    this.emitCart();
  }

  private saveCart() {
    try {
      localStorage.setItem('cart', JSON.stringify(this.cart));
    } catch (e) {
      console.error('Cart save error:', e);
    }
  }

  private emitCart() {
    this.cartSubject.next([...this.cart]);
  }

  // ============================================
  // GETTERS
  // ============================================
  getCart() {
    return [...this.cart];
  }

  getTotalItems() {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalPrice() {
    return this.cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  // ============================================
  // ADD ITEM
  // ============================================
  addToCart(product: any) {
    if (!product?.id) return;

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

  // ============================================
  // UPDATE QUANTITY
  // ============================================
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

  // ============================================
  // REMOVE ITEM
  // ============================================
  removeFromCart(id: number) {
    this.cart = this.cart.filter(item => item.id !== id);
    this.updateCart();
  }

  // ============================================
  // CLEAR CART
  // ============================================
  clearCart() {
    this.cart = [];
    this.saveCart();
    this.emitCart();
  }
}