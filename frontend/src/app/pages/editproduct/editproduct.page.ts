import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonButtons,
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { ProductService } from 'src/app/services/product.service';

@Component({
  selector: 'app-editproduct',
  templateUrl: './editproduct.page.html',
  styleUrls: ['./editproduct.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonButton,
    IonButtons,
    IonSelect,
    IonSelectOption,
    CommonModule,
    FormsModule
  ]
})
export class EditproductPage implements OnInit {

  @Input() product: any;

  categories: any[] = []; // 🔥 ESTO FALTABA

  constructor(
    private modalCtrl: ModalController,
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.loadCategories();

    if (!this.product) {
      this.product = {
        id: null,
        name: '',
        description: '',
        price: 0,
        image: '',
        category_id: null,
        isPopular: false
      };
    }
  }

  loadCategories() {
    this.productService.getCategories().subscribe({
      next: (res) => {
        this.categories = res;
      },
      error: (err: any) => {
        console.error(err);
      }
    });
  }

  updateProduct() {
    this.productService.updateProduct(this.product.id, this.product)
      .subscribe({
        next: () => {
          alert('Producto actualizado correctamente');
          this.modalCtrl.dismiss(true);
        },
        error: (err: any) => {
          console.error(err);
          alert('Error al actualizar el producto');
        }
      });
  }

  closeModal() {
    this.modalCtrl.dismiss(false);
  }
}
