import { firstValueFrom, Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { ProductService } from 'src/app/services/product.service';
import { FooterComponent } from 'src/app/components/footer/footer.component';
import { SidebarMenuComponent } from 'src/app/components/sidebar-menu/sidebar-menu.component';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from 'src/app/services/cart.service';
import { ProductCarouselComponent } from 'src/app/components/product-carousel/product-carousel.component';

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
    SidebarMenuComponent,
    ProductCarouselComponent
  ],
  templateUrl: './init.page.html',
  styleUrls: ['./init.page.scss']
})
export class InitPage implements OnInit, OnDestroy {

  categories: Category[] = [];
  products: Product[] = [];
  filteredProducts: Product[] = [];

  // 🔥 NUEVO: productos para el carrusel
  popularProducts: Product[] = [];

  activeCategory = 0;
  searchTerm = '';
  cartCount = 0;

  isMenuOpen = false;
  scrolled = false;
  loading = true;
  error = false;

  searchSubject = new Subject<string>();
  private cartSub!: Subscription;

  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('sidebarMenuRef') sidebarMenu!: SidebarMenuComponent;

  constructor(
    private router: Router,
    private authService: AuthService,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.loadData();

    // 🔍 debounce buscador
    this.searchSubject
      .pipe(debounceTime(400))
      .subscribe(value => {
        this.searchTerm = value;
        this.filterProducts();
      });

    // 🛒 CARRITO REACTIVO (esto evita freeze y bugs)
    this.cartSub = this.cartService.cart$.subscribe(items => {
      this.cartCount = items.reduce((total, item) => total + item.quantity, 0);
    });
  }

  ngOnDestroy() {
    this.cartSub?.unsubscribe();
  }

  async loadData() {
    this.loading = true;
    this.error = false;

    try {
      const [categories, products] = await Promise.all([
        firstValueFrom(this.productService.getCategories()),
        firstValueFrom(this.productService.getProducts())
      ]);

      this.categories = [{ id: 0, name: 'Todos' }, ...categories];

      this.products = products;
      this.filteredProducts = products;

      // 🔥 AQUÍ SE GENERA EL CARRUSEL (NO EN HTML)
      this.popularProducts = products
        .filter(p => p.isPopular && p.image) // solo con imagen
        .slice(0, 5); // máximo 5

    } catch (error) {
      console.error('Error cargando datos', error);
      this.error = true;
    } finally {
      this.loading = false;
    }
  }

  onSearchChange(event: any) {
    this.searchSubject.next(event.target.value);
  }

  setActiveCategory(categoryId: number) {
    this.activeCategory = categoryId;
    this.filterProducts();
  }

  goToCart() {
    this.router.navigate(['/cart']);
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

  // 🛒 AGREGAR AL CARRITO
  addToCart(product: Product) {
    this.cartService.addToCart(product);
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