import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { ProductService } from 'src/app/services/product.service';
import { FooterComponent } from 'src/app/components/footer/footer.component';
import { SidebarMenuComponent } from 'src/app/components/sidebar-menu/sidebar-menu.component';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


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
  selector: 'app-init',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    FooterComponent,
    SidebarMenuComponent
  ],
  templateUrl: './init.page.html',
  styleUrls: ['./init.page.scss']
})
export class InitPage implements OnInit {

  categories: Category[] = [];
  products: Product[] = [];
  filteredProducts: Product[] = [];

  activeCategory = 0;
  searchTerm = '';
  cartCount = 0;
  isMenuOpen = false;
  scrolled = false;

  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('sidebarMenuRef') sidebarMenu!: SidebarMenuComponent;

  constructor(
    private router: Router,
    private authService: AuthService,
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories() {
    this.productService.getCategories().subscribe(res => {
      this.categories = [{ id: 0, name: 'Todos' }, ...res];
    });
  }

  loadProducts() {
  this.productService.getProducts().subscribe(res => {
    console.log('PRODUCTOS:', res);
    this.products = res;
    this.filteredProducts = res;
  });
}

  setActiveCategory(categoryId: number) {
    this.activeCategory = categoryId;
    this.filterProducts();
  }

  filterProducts() {
    let filtered = this.activeCategory === 0
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
    this.cartCount++;
    console.log('Agregado:', product.name);
  }

  scrollToMenu() {
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.sidebarMenu?.toggleMenu();
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  @HostListener('window:scroll', [])
  onScroll() {
    this.scrolled = window.scrollY > 50;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
