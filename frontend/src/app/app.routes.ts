import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro.page').then( m => m.RegistroPage)
  },
  {
    path: 'init',
    loadComponent: () => import('./pages/init/init.page').then( m => m.InitPage)
  },
  {
    path: 'recupass',
    loadComponent: () => import('./pages/recupass/recupass.page').then( m => m.RecupassPage)
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pages/perfil/perfil.page').then( m => m.PerfilPage)
  },
  {
    path: 'admin-dashboard',
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard.page').then( m => m.AdminDashboardPage)
  },
  {
    path: 'changepassw',
    loadComponent: () => import('./pages/changepassw/changepassw.page').then( m => m.ChangepasswPage)
  },
  {
    path: 'menu',
    loadComponent: () => import('./pages/menu/menu.page').then( m => m.MenuPage)
  },
  {
    path: 'error404',
    loadComponent: () => import('./pages/errors/error404/error404.page').then( m => m.Error404Page)
  },
  {
    path: 'error500',
    loadComponent: () => import('./pages/errors/error500/error500.page').then( m => m.Error500Page)
  },
 {
  path: 'add-product',
  loadComponent: () =>
    import('./pages/addproduct/addproduct.page').then(m => m.AddProductPage)
  },  
  {
    path: 'products',
    loadComponent: () => import('./pages/products/products.page').then( m => m.ProductsPage)
  },
  {
    path: 'gestionprod',
    loadComponent: () => import('./pages/gestionprod/gestionprod.page').then( m => m.GestionprodPage)
  },
  {
    path: '**',
    redirectTo: 'error404'
  },
  {
    path: 'editproduct',
    loadComponent: () => import('./pages/editproduct/editproduct.page').then( m => m.EditproductPage)
  },
];
