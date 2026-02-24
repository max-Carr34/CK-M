import { Component } from '@angular/core';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-error404',
  templateUrl: './error404.page.html',
  styleUrls: ['./error404.page.scss'],
  standalone: true,
  imports: [IonContent, IonButton, RouterModule],
})
export class Error404Page {}

