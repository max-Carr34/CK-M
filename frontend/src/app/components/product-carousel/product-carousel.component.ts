import { Component, Input, OnInit, OnDestroy } from '@angular/core';
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

  currentIndex = 0;
  intervalId: any;

  ngOnInit() {
    this.startAutoSlide();
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  startAutoSlide() {
    this.intervalId = setInterval(() => {
      this.next();
    }, 3000);
  }

  next() {
    if (this.products.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.products.length;
  }

  prev() {
    if (this.products.length === 0) return;
    this.currentIndex =
      (this.currentIndex - 1 + this.products.length) % this.products.length;
  }
}