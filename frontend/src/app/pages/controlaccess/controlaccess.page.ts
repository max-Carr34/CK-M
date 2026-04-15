import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NavController } from '@ionic/angular';

import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-controlaccess',
  templateUrl: './controlaccess.page.html',
  styleUrls: ['./controlaccess.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class ControlaccessPage implements OnInit, OnDestroy {

  stats: any = null;
  logs: any[] = [];
  users: any[] = [];
  sessions: any[] = [];

  filteredUsers: any[] = [];

  isLoading = true;
  error = false;

  segment: string = 'logs';

  userToDelete: any = null;

  // 🔍 filtros
  searchTerm: string = '';
  selectedRole: string = 'all';
  selectedStatus: string = 'all';

  private intervalId: any;
  private service = inject(AuthService);
  private navCtrl = inject(NavController);

  ngOnInit() {
    this.loadAll();

    // sesiones en tiempo real
    this.intervalId = setInterval(() => {
      this.loadSessions();
    }, 10000);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  // ===============================
  // LOAD DATA
  // ===============================
  loadAll() {
    this.loadStats();
    this.loadLogs();
    this.loadUsers();
    this.loadSessions();
  }

  loadStats() {
    this.isLoading = true;
    this.error = false;

    this.service.getStats().subscribe({
      next: (res) => {
        this.stats = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error stats:', err);
        this.error = true;
        this.isLoading = false;
      }
    });
  }

  loadLogs() {
    this.service.getLogs().subscribe({
      next: (res: any) => this.logs = res,
      error: (err) => console.error('Error logs:', err)
    });
  }

  loadSessions() {
    this.service.getSessions().subscribe({
      next: (res: any) => this.sessions = res,
      error: (err) => console.error('Error sessions:', err)
    });
  }

  loadUsers() {
  this.service.getUsers().subscribe({
    next: (res: any) => {
      this.users = res;
      this.filteredUsers = [...res];
    },
    error: (err) => console.error('Error users:', err)
  });
  }

  // ===============================
  // FILTROS + BUSCADOR
  // ===============================
  filterUsers() {
    const term = this.searchTerm.toLowerCase();

    this.filteredUsers = this.users.filter(user => {
      const matchesSearch =
        user.nombre.toLowerCase().includes(term) ||
        user.correo.toLowerCase().includes(term);

      const matchesRole =
        this.selectedRole === 'all' || user.rol === this.selectedRole;

      const matchesStatus =
        this.selectedStatus === 'all' || user.estado === this.selectedStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }
  goBack() {
    this.navCtrl.back();
  }

  // ===============================
  // EDIT USER
  // ===============================
  editUser(user: any) {
    const nuevoCorreo = prompt('Nuevo correo:', user.correo);
    if (!nuevoCorreo) return;

    this.service.updateUser(user.id, nuevoCorreo).subscribe({
      next: () => {
        user.correo = nuevoCorreo; // 🔥 sin recargar
        this.filterUsers();
      },
      error: (err) => console.error('Error update:', err)
    });
  }

  // ===============================
  // DELETE FLOW
  // ===============================
  confirmDelete(user: any) {
    this.userToDelete = user;
  }

  cancelDelete() {
    this.userToDelete = null;
  }

  executeDelete() {
    if (!this.userToDelete) return;

    this.service.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== this.userToDelete.id);
        this.filterUsers();
        this.cancelDelete();
      },
      error: (err) => console.error('Error delete:', err)
    });
  }

  // ===============================
  // FORCE LOGOUT
  // ===============================
  forceLogout(id: number) {
    if (!confirm('¿Cerrar sesión del usuario?')) return;

    this.service.forceLogoutUser(id).subscribe({
      next: () => {
        this.sessions = this.sessions.filter(s => s.user_id !== id);
      },
      error: (err) => console.error('Error logout:', err)
    });
  }
}