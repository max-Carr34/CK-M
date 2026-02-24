import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-sidebar-menu',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './sidebar-menu.component.html',
  styleUrls: ['./sidebar-menu.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SidebarMenuComponent implements OnInit {

  @Input() isMenuOpen = false;
  @Output() menuOpenChange = new EventEmitter<boolean>();

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit() {
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.menuOpenChange.emit(this.isMenuOpen);
  }

  closeMenu() {
    this.isMenuOpen = false;
    this.menuOpenChange.emit(false);
  }

  handleMenuOption(option: string) {
    switch (option) {
      case 'profile':
        this.router.navigate(['/perfil']);
        break;
      case 'contact':
        this.router.navigate(['/communication-select']);
        break;
      case 'menu':
        this.router.navigate(['/menu']);
        break;
      case 'notifications':
        this.router.navigate(['/notifications']);
        break;
      case 'logout':
        this.authService.logout();
        this.router.navigate(['/home']);
        break;
    }
    this.closeMenu();
  }

}
