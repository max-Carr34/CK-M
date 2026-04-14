import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { Subscription } from 'rxjs';

interface MenuItem {
  key: string;
  label: string;
  icon: string;
  route?: string;
}

@Component({
  selector: 'app-sidebar-menu',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './sidebar-menu.component.html',
  styleUrls: ['./sidebar-menu.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SidebarMenuComponent implements OnInit, OnDestroy {

  @Input() isMenuOpen = false;
  @Output() menuOpenChange = new EventEmitter<boolean>();

  private userSub!: Subscription;

  selected: string = '';

  // 🔥 DATOS REALES DEL USUARIO
  userName: string = 'Usuario';
  userEmail: string = '';

  // 🚀 MENÚ
  menuItems: MenuItem[] = [
    { key: 'profile', label: 'Perfil', icon: '👤', route: '/perfil' },
    { key: 'contact', label: 'Contacto', icon: '📞', route: '/communication-select' },
    { key: 'menu', label: 'Menú', icon: '🍔', route: '/menu' },
    { key: 'notifications', label: 'Comprobantes', icon: '🔔', route: '/notifications' },
    { key: 'promotions', label: 'Promociones', icon: '🎁', route: '/promotions' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    // 🔥 REACTIVO → se actualiza solo cuando cambia sesión
    this.userSub = this.authService.user$.subscribe(user => {
      if (user) {
        this.userName = user.nombre || 'Usuario';
        this.userEmail = user.correo || '';
      } else {
        this.userName = 'Usuario';
        this.userEmail = '';
      }
    });
  }

  ngOnDestroy() {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  // ============================================
  // AVATAR
  // ============================================
  getInitials(): string {
    if (!this.userName) return 'U';

    const parts = this.userName.trim().split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }

  // ============================================
  // MENU CONTROL
  // ============================================
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.menuOpenChange.emit(this.isMenuOpen);
  }

  closeMenu() {
    this.isMenuOpen = false;
    this.menuOpenChange.emit(false);
  }

  // ============================================
  // NAVIGATION
  // ============================================
  handleMenuOption(option: string) {
    this.selected = option;

    if (option === 'logout') {
      this.logout();
      return;
    }

    const item = this.menuItems.find(i => i.key === option);

    if (item?.route) {
      this.router.navigate([item.route]);
    }

    this.closeMenu();
  }

  logout() {
    this.authService.logout();
    this.navCtrl.navigateRoot('/login');
  }
}