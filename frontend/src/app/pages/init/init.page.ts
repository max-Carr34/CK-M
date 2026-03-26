import { firstValueFrom } from 'rxjs'; // Promesa
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators'; // debounce para el buscador
import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { ProductService } from 'src/app/services/product.service';
import { FooterComponent } from 'src/app/components/footer/footer.component';
import { SidebarMenuComponent } from 'src/app/components/sidebar-menu/sidebar-menu.component';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from 'src/app/services/cart.service';

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
  searchSubject = new Subject<string>(); //debounce
  loading = true; // Loader
  error = false;

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

    this.searchSubject //configuracion de Debounce
    .pipe(debounceTime(400))
    .subscribe(value => {
      this.searchTerm = value;
      this.filterProducts();
    });
    this.cartCount = this.cartService.getTotalItems(); // Config Carrito
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

  } catch (error) {
    console.error('Error cargando datos', error); //Loader
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


  addToCart(product: Product) {
  this.cartService.addToCart(product);
  this.cartCount = this.cartService.getTotalItems();
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
