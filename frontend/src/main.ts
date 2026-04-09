import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; 
import { addIcons } from 'ionicons';
import { pencilOutline, trashOutline } from 'ionicons/icons';


import { authInterceptor } from './app/interceptors/auth.interceptor';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';


addIcons({ 'pencil-outline': pencilOutline, 'trash-outline': trashOutline });
bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy ,},
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor])),
    
  ],
});
