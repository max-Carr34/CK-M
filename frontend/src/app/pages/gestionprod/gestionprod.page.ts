import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ProductService } from 'src/app/services/product.service';
import { EditproductPage } from '../editproduct/editproduct.page';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-gestionprod',
  templateUrl: './gestionprod.page.html',
  styleUrls: ['./gestionprod.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule,
  ]
})
export class GestionprodPage implements OnInit {

  products: any[] = [];
  filteredProducts: any[] = [];
  categories: any[] = [];

  searchQuery = '';
  selectedCategory: number | null = null;
  isLoading = true;

  // ─── Modal eliminar ────────────────────────────
  productToDelete: any = null;

  // ─── Ordenamiento ──────────────────────────────
  sortField: 'name' | 'price' | 'stock' = 'name';
  sortDir: 'asc' | 'desc' = 'asc';

  sortOptions = [
    { label: 'Nombre', value: 'name'  as const },
    { label: 'Precio', value: 'price' as const },
    { label: 'Stock',  value: 'stock' as const },
  ];

  constructor(
    private productService: ProductService,
    private modalCtrl: ModalController,      // ✅ quitamos AlertController
    private toastCtrl: ToastController,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  // ─── TrackBy ───────────────────────────────────
  trackByProduct(_: number, p: any) { return p.id; }
  trackByCategory(_: number, c: any) { return c.id; }

  // ─── Carga ─────────────────────────────────────
  loadCategories() {
    this.productService.getCategories().subscribe({
      next: (res) => {
        this.categories = res;
      },
      error: async () => {
        await this.showToast('No se pudieron cargar las categorías', 'warning');
      }
    });
  }

  loadProducts() {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (res) => {
        this.products = res;
        this.applyFilters();
        this.isLoading = false;
      },
      error: async () => {
        this.isLoading = false;
        await this.showToast('Error al cargar productos. Intenta de nuevo.', 'danger');
      }
    });
  }

  goBack() {
    this.navCtrl.back();
  }

  // ─── Filtros ───────────────────────────────────
  selectCategory(id: number | null) {
    this.selectedCategory = id;
    this.applyFilters();
  }

  applyFilters() {
    let result = [...this.products];

    if (this.selectedCategory !== null) {
      result = result.filter(p => p.category_id === this.selectedCategory);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    result = this.sortProducts(result);
    this.filteredProducts = result;
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
  }

  getCategoryName(id: number): string {
    return this.categories.find(c => c.id === id)?.name ?? '—';
  }

  // ─── Ordenamiento ──────────────────────────────
  setSort(field: 'name' | 'price' | 'stock') {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.applyFilters();
  }

  private sortProducts(list: any[]): any[] {
    return [...list].sort((a, b) => {
      let valA = a[this.sortField];
      let valB = b[this.sortField];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return this.sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // ─── Editar (MODAL) ────────────────────────────
  async editProduct(product: any) {
    const modal = await this.modalCtrl.create({
      component: EditproductPage,
      componentProps: {
        product: { ...product }
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data) {
      this.loadProducts();
      await this.showToast(`"${product.name}" actualizado correctamente`, 'success');
    }
  }

  // ─── Eliminar (modal propio) ───────────────────
  confirmDelete(product: any) {
    this.productToDelete = product;   // abre el modal
  }

  cancelDelete() {
    this.productToDelete = null;      // cierra sin hacer nada
  }

  executeDelete() {
    if (!this.productToDelete) return;
    const product = this.productToDelete;
    this.productToDelete = null;      // cierra el modal primero

    this.productService.deleteProduct(product.id).subscribe({
      next: async () => {
        this.products = this.products.filter(p => p.id !== product.id);
        this.applyFilters();
        await this.showToast(`"${product.name}" eliminado`, 'success');
      },
      error: async () => {
        await this.showToast('No se pudo eliminar el producto', 'danger');
      }
    });
  }

  // ─── Popular toggle ────────────────────────────
  togglePopular(product: any) {
    const nuevoEstado = !product.isPopular;
    const updated = { ...product, isPopular: nuevoEstado };

    this.productService.updateProduct(product.id, updated).subscribe({
      next: async () => {
        product.isPopular = nuevoEstado;
        const msg = nuevoEstado
          ? `⭐ "${product.name}" marcado como popular`
          : `"${product.name}" quitado de populares`;
        await this.showToast(msg, nuevoEstado ? 'success' : 'medium');
      },
      error: async () => {
        await this.showToast('No se pudo actualizar el producto', 'danger');
      }
    });
  }

  // ─── Toast helper ──────────────────────────────
  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'warning' | 'medium' = 'success'
  ) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2800,
      color,
      position: 'bottom',
      swipeGesture: 'vertical',
      buttons: [{ icon: 'close-outline', role: 'cancel' }]
    });
    await toast.present();
  }
}