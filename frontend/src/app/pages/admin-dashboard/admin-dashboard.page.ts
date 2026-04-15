import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { SidebarMenuComponent } from 'src/app/components/sidebar-menu/sidebar-menu.component';

import {
  listOutline,
  addCircleOutline,
  barChartOutline,
  arrowForwardOutline,
  peopleOutline,
  cubeOutline,
  cartOutline,
  alertCircleOutline,
  statsChartOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SidebarMenuComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonIcon
  ]
})
export class AdminDashboardPage implements OnInit {

  isMenuOpen: boolean = false;

  @ViewChild('sidebarMenuRef') sidebarMenu!: SidebarMenuComponent;

  constructor(private router: Router) {
    addIcons({
      'list-outline': listOutline,
      'add-circle-outline': addCircleOutline,
      'bar-chart-outline': barChartOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'people-outline': peopleOutline,
      'cube-outline': cubeOutline,
      'cart-outline': cartOutline,
      'alert-circle-outline': alertCircleOutline,
      'stats-chart-outline': statsChartOutline
    });
  }

  ngOnInit(): void {}

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.sidebarMenu) {
      this.sidebarMenu.toggleMenu();
    }
  }

  goToAddProduct(): void {
    this.router.navigate(['/add-product']);
  }

  gestionprod(): void {
    this.router.navigate(['/gestionprod']);
  }

  goToReports(): void {
    this.router.navigate(['/reports']);
  }

  goToUsers(): void {
    this.router.navigate(['/controlaccess']);
  }
}