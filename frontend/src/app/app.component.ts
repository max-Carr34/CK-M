import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

    if (!usuario) {
      this.router.navigate(['/login']);
    }
  }
}
