import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, NavController } from '@ionic/angular';
import { ProductService } from 'src/app/services/product.service';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';

@Component({
  selector: 'addproduct',
  templateUrl: './addproduct.page.html',
  styleUrls: ['./addproduct.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class AddProductPage implements OnInit {

  // 📦 Objeto que se enviará al backend
  product: any = {
    name: '',
    description: '',
    price: 0,
    image: '',
    category_id: null,
    stock: 0,
    isPopular: false
  };

  // 📂 Lista de categorías desde backend
  categories: any[] = [];

  // 🖼 Preview de imagen
  imagePreview = '';

  constructor(
    private productService: ProductService,
    private alertCtrl: AlertController,
    private navCtrl: NavController
  ) {
    // 🔥 Registrar icono para que se vea en standalone
    addIcons({
      'arrow-back-outline': arrowBackOutline
    });
  }

  // 🚀 Al cargar la página
  ngOnInit() {
    this.loadCategories();
  }

  // 📥 Obtener categorías
  loadCategories() {
    this.productService.getCategories().subscribe(res => {
      this.categories = res;
    });
  }

  // ⬅ Navegación manual hacia atrás
  goBack() {
    this.navCtrl.back();
  }

  // 🖼 Actualizar preview cuando cambia URL imagen
  updateImagePreview() {
    this.imagePreview = this.product.image;
  }

  // 💾 Guardar producto
  async saveProduct() {

    // 🔎 Validación básica
    if (!this.product.name || !this.product.price || !this.product.category_id) {
      const alert = await this.alertCtrl.create({
        cssClass: 'custom-alert alert-warning',
        header: 'Campos incompletos',
        subHeader: '⚠',
        message: 'Completa nombre, precio y categoría antes de continuar.',
        buttons: [{ text: 'Entendido', cssClass: 'alert-btn-primary' }]
      });
      await alert.present();
      return;
    }

    // 📤 Enviar al backend
    this.productService.createProduct(this.product).subscribe({

      // ✅ Éxito
      next: async () => {
        const alert = await this.alertCtrl.create({
          cssClass: 'custom-alert alert-success',
          header: '¡Producto creado!',
          subHeader: '✓',
          message: `"${this.product.name}" fue agregado correctamente.`,
          buttons: [{ text: 'Aceptar', cssClass: 'alert-btn-primary' }]
        });

        await alert.present();
        this.resetForm();
      },

      // ❌ Error
      error: async (err: any) => {
        console.error(err);

        const alert = await this.alertCtrl.create({
          cssClass: 'custom-alert alert-error',
          header: 'Error al guardar',
          subHeader: '✕',
          message: 'No se pudo guardar el producto. Intenta nuevamente.',
          buttons: [{ text: 'Entendido', cssClass: 'alert-btn-primary' }]
        });

        await alert.present();
      }
    });
  }

  // 🔄 Resetear formulario
  resetForm() {
    this.product = {
      name: '',
      description: '',
      price: 0,
      image: '',
      category_id: null,
      stock: 0,
      isPopular: false
    };

    this.imagePreview = '';
  }
}
