import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';


import { SidebarMenuComponent } from 'src/app/components/sidebar-menu/sidebar-menu.component';

@Component({
  selector: 'app-list-comp',
  standalone: true,
  templateUrl: './list-comp.page.html',
  styleUrls: ['./list-comp.page.scss'],
  imports: [CommonModule, IonicModule, SidebarMenuComponent]
})
export class ListCompPage implements OnInit {

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private loadingCtrl = inject(LoadingController);


  isMenuOpen: boolean = false;
  orders: any[] = [];


  ngOnInit() {
    this.loadOrders();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  async loadOrders() {

    const loading = await this.loadingCtrl.create({
      message: 'Cargando comprobantes...'
    });

    await loading.present();

    this.authService.user$.subscribe(user => {

      if (!user) {
        loading.dismiss();
        return;
      }

      this.http.get<any[]>(
        `${environment.apiUrl}/orders/user/${user.id}`
      ).subscribe({

        next: async (orders) => {

          // 🔥 cargar detalle completo de cada pedido
          const detailedOrders = await Promise.all(

            orders.map(order =>
              this.http.get<any>(
                `${environment.apiUrl}/orders/${order.id}`
              ).toPromise()
            )

          );

          this.orders = detailedOrders;

          console.log('🧾 COMPROBANTES:', this.orders);

          loading.dismiss();
        },

        error: async (err) => {

          console.error('❌ ERROR:', err);

          loading.dismiss();
        }

      });

    });

  }

  getTotalProducts(products: any[]): number {

    return products.reduce(
      (total, item) => total + item.quantity,
      0
    );

  }

}