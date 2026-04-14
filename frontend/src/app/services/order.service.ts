import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private http = inject(HttpClient);
  private API = 'http://localhost:3000/api';

  // CREAR PEDIDO
  createOrder(data: any) {
    return this.http.post(`${this.API}/orders`, data);
  }

  // OBTENER PEDIDOS POR USUARIO (CLAVE)
  getOrdersByUser(userId: number) {
    return this.http.get<any[]>(`${this.API}/orders/user/${userId}`);
  }

  // (opcional)
  getOrderById(id: number) {
    return this.http.get(`${this.API}/orders/${id}`);
  }
}