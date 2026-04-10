import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from 'src/app/services/product.service';
import { FooterComponent } from 'src/app/components/footer/footer.component';
import { SidebarMenuComponent } from 'src/app/components/sidebar-menu/sidebar-menu.component';

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string | null;
  isPopular: boolean;
  category: string;
  category_id: number;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    FooterComponent,
    SidebarMenuComponent
  ],
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss']
})
export class MenuPage implements OnInit {

  scrolled = false;
  isMenuOpen = false;

  categories: Category[] = [];
  products: Product[] = [];
  filteredProducts: Product[] = [];

  activeCategory = 0;
  searchTerm = '';
  cartCount = 0;

  constructor(
    private router: Router,
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 40;
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  loadCategories() {
    this.productService.getCategories().subscribe(res => {
      this.categories = [{ id: 0, name: 'Todos' }, ...res];
    });
  }

  loadProducts() {
    this.productService.getProducts().subscribe(res => {
      this.products = res;
      this.filteredProducts = res;
    });
  }

  setActiveCategory(categoryId: number) {
    this.activeCategory = categoryId;
    this.filterProducts();
  }

  filterProducts() {
    let filtered =
      this.activeCategory === 0
        ? this.products
        : this.products.filter(p => p.category_id === this.activeCategory);

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
      );
    }

    this.filteredProducts = filtered;
  }

  addToCart(product: Product) {
    console.log('Producto agregado:', product.name);
  }

  scrollToMenu() {
    const element = document.getElementById('menu');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}