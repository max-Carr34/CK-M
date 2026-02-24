import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ModalController } from '@ionic/angular';
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

  constructor(
    private productService: ProductService,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  // ─── Carga ─────────────────────
  loadCategories() {
    this.productService.getCategories().subscribe(res => {
      this.categories = res;
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
      error: () => {
        this.isLoading = false;
      }
    });
  }
  goBack() {
    this.navCtrl.back();
  }

  gotoAddProduct() {
    this.navCtrl.navigateForward('/addproduct');
  }

  // ─── Filtros ───────────────────
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

    this.filteredProducts = result;
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
  }

  getCategoryName(id: number): string {
    return this.categories.find(c => c.id === id)?.name ?? '—';
  }

  // ─── Editar (MODAL) ────────────
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
    }
  }

  // ─── Eliminar ──────────────────
  async confirmDelete(product: any) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar producto',
      message: `¿Seguro que quieres eliminar "${product.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: () => this.deleteProduct(product)
        }
      ]
    });

    await alert.present();
  }

  deleteProduct(product: any) {
    this.productService.deleteProduct(product.id).subscribe(() => {
      this.products = this.products.filter(p => p.id !== product.id);
      this.applyFilters();
    });
  }
  // ─── Popular toggle ─────────────
  togglePopular(product: any) {
    const updated = { ...product, isPopular: !product.isPopular };

    this.productService.updateProduct(product.id, updated)
      .subscribe({
        next: () => {
          product.isPopular = !product.isPopular;
        },
        error: async () => {
          const alert = await this.alertCtrl.create({
            header: 'Error',
            message: 'No se pudo actualizar el producto.',
            buttons: ['OK']
          });
          await alert.present();
        }
      });
  }

}
