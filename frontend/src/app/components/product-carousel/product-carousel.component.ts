import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string | null;
  isPopular: boolean;
}

@Component({
  selector: 'app-product-carousel',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './product-carousel.component.html',
  styleUrls: ['./product-carousel.component.scss']
})
export class ProductCarouselComponent implements OnInit, OnDestroy {

  @Input() products: Product[] = [];
  @Output() addToCart = new EventEmitter<Product>();

  currentIndex = 0;
  private intervalId: any;

  ngOnInit() {
    this.startAutoSlide();
  }

  ngOnDestroy() {
    this.stopAutoSlide();
  }

  startAutoSlide() {
    this.intervalId = setInterval(() => this.next(), 3500);
  }

  stopAutoSlide() {
    clearInterval(this.intervalId);
  }

  next() {
    if (!this.products.length) return;
    this.currentIndex = (this.currentIndex + 1) % this.products.length;
  }

  prev() {
    if (!this.products.length) return;
    this.currentIndex = (this.currentIndex - 1 + this.products.length) % this.products.length;
  }

  goTo(index: number) {
    this.currentIndex = index;
  }

  onAddToCart(product: Product) {
    this.addToCart.emit(product);
  }
}