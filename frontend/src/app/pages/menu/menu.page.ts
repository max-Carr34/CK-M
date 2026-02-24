import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { SidebarMenuComponent } from 'src/app/components/sidebar-menu/sidebar-menu.component';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, SidebarMenuComponent]
})
export class MenuPage implements OnInit {

  isMenuOpen: boolean = false;
  @ViewChild('sidebarMenuRef') sidebarMenu!: SidebarMenuComponent;

  constructor() { }

  ngOnInit() {
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.sidebarMenu) {
      this.sidebarMenu.toggleMenu();
    }
  }

}
