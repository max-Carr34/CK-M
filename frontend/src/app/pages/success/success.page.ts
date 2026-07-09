// success.page.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import * as i from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [
    CommonModule,
    i.IonContent,
    i.IonButton,
    i.IonIcon,
    i.IonSpinner
  ],
  templateUrl: './success.page.html',
  styleUrls: ['./success.page.scss']
})
export class SuccessPage implements OnInit {

  orderId: string = '';
  total: number = 0;
  method: string = '';
  status: string = '';
  isLoading: boolean = true;
  products: any[] = [];

  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private navCtrl = inject(NavController);

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';

    console.log('📦 ORDER ID:', this.orderId);

    if (!this.orderId) {
      console.error('❌ No hay orderId');
      this.isLoading = false;
      return;
    }

    this.loadOrder();
  }

  // 🔥 Traer pedido del backend
  loadOrder() {
    this.http.get(`${environment.apiUrl}/orders/${this.orderId}`)
      .subscribe({
        next: (res: any) => {
          console.log('✅ ORDER DATA:', res);

          this.total = Number(res.total ?? 0);
          this.status = res.status ?? 'pending';
          this.method = res.payment_method ?? 'cash';
          this.products = res.products || [];

          this.isLoading = false;

          // 🔥 guardar productos recientes
          this.saveRecentProducts(this.products);
        },
        error: (err) => {
          console.error('❌ ERROR:', err);
          this.isLoading = false;
        }
      });
  }

  goHome() {
    this.navCtrl.navigateRoot('/menu');
  }

  // 🔥 GUARDAR PRODUCTOS RECIENTES
  saveRecentProducts(products: any[]) {

    // normalizar productos
    const normalized = products.map((p, index) => ({
      id: p.id || p.product_id || index,
      name: p.product_name || p.name,
      price: p.price,
      image: p.image,
      quantity: p.quantity
    }));

    // traer existentes
    const existing = JSON.parse(
      localStorage.getItem('recentProducts') || '[]'
    );

    // evitar duplicados
    const merged = [...normalized, ...existing].reduce(
      (acc: any[], current: any) => {

        const found = acc.find(
          p => p.name === current.name
        );

        if (!found) {
          acc.push(current);
        }

        return acc;

      }, []
    );

    // últimos 3
    const limited = merged.slice(0, 3);

    console.log('🔥 GUARDANDO:', limited);

    localStorage.setItem(
      'recentProducts',
      JSON.stringify(limited)
    );
  }
}