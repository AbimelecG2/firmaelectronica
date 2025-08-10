import { Routes } from '@angular/router';
import { LoginComponent } from './core/auth/login/login.component';
import { MenulateralComponent } from './core/layout/menulateral/menulateral.component';
import { InicioComponent } from './features/app-dashboard/views/inicio/inicio.component';
import { AuthGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  
  { path: '', redirectTo: 'login', pathMatch: 'full' },


  {
     path: 'login', component: LoginComponent
  },
  {
    path: 'inicio',
    canActivate: [AuthGuard],
    component: MenulateralComponent,
    children: [
      
      { path: '', component: InicioComponent }
    ]
  },
    { path: '**', redirectTo: 'login' },
  
];