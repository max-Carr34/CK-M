import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private http = inject(HttpClient);
  private API = environment.apiUrl;

  // ============================================
  // CREAR PEDIDO
  // ============================================
  createOrder(data: any) {
    return this.http.post(`${this.API}/orders`, data);
  }

  // ============================================
  // OBTENER PEDIDOS POR USUARIO
  // ============================================
  getOrdersByUser(userId: number) {
    return this.http.get<any[]>(`${this.API}/orders/user/${userId}`);
  }

  // ============================================
  // OBTENER PEDIDO POR ID
  // ============================================
  getOrderById(id: number) {
    return this.http.get(`${this.API}/orders/${id}`);
  }
}