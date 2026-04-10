import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from 'src/app/services/product.service';
import { FooterComponent } from 'src/app/components/footer/footer.component';
import { SidebarMenuComponent } from 'src/app/components/sidebar-menu/sidebar-menu.component';
import { CartService } from 'src/app/services/cart.service';
import { Subscription } from 'rxjs';
import { ProductCarouselComponent } from 'src/app/components/product-carousel/product-carousel.component';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    FooterComponent,
    SidebarMenuComponent,
    ProductCarouselComponent
  ],
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss']
})
export class MenuPage implements OnInit, OnDestroy {

  scrolled = false;
  isMenuOpen = false;

  categories: any[] = [];
  products: any[] = [];
  filteredProducts: any[] = [];

  activeCategory = 0;
  searchTerm = '';
  cartCount = 0;

  private cartSub!: Subscription;

  constructor(
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();

    // 🔥 CLAVE
    this.cartSub = this.cartService.cart$.subscribe(items => {
      this.cartCount = items.reduce((t, i) => t + i.quantity, 0);
    });
  }

  ngOnDestroy() {
    this.cartSub?.unsubscribe();
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

  setActiveCategory(id: number) {
    this.activeCategory = id;
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

  addToCart(product: any) {
    this.cartService.addToCart(product);
  }

  goToCart() {
    this.router.navigate(['/cart']);
  }

  scrollToMenu() {
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  }

  onSearchChange(event: any) {
    this.searchTerm = event.target.value;
    this.filterProducts();
  }
}