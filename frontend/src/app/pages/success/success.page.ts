import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import * as i from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';

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

  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private navCtrl = inject(NavController);

  ngOnInit() {
    // 🔥 ID desde la URL /success/:id
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
    this.http.get(`http://localhost:3000/api/orders/${this.orderId}`)
      .subscribe({
        next: (res: any) => {
          console.log('✅ ORDER DATA:', res);

          this.total = Number(res.total ?? 0);
          this.status = res.status ?? 'pending';
          this.method = res.payment_method ?? 'cash';

          this.isLoading = false;
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
}