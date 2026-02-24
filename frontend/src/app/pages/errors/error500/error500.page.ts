import { Component } from '@angular/core';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-error500',
  templateUrl: './error500.page.html',
  styleUrls: ['./error500.page.scss'],
  standalone: true,
  imports: [IonContent, IonButton, RouterModule],
})
export class Error500Page {}

