import { Routes } from '@angular/router';
import { LoginComponent } from './core/auth/login/login.component';
import { MenulateralComponent } from './core/layout/menulateral/menulateral.component';
import { InicioComponent } from './features/app-dashboard/views/inicio/inicio.component';
import { AuthGuard } from './core/guards/auth-guard';
import { SobresComponent } from './features/app-dashboard/views/sobres/sobres.component';
import { CertificadosComponent } from './features/app-dashboard/views/certificados/certificados.component';
import { FirmantesComponent } from './features/app-dashboard/views/firmantes/firmantes.component';
import { ReportesComponent } from './features/app-dashboard/views/reportes/reportes.component';
import { AnalisisComponent } from './features/app-dashboard/views/analisis/analisis.component';
import { AjustesComponent } from './features/app-dashboard/views/ajustes/ajustes.component';
import { AyudaComponent } from './features/app-dashboard/views/ayuda/ayuda.component';
import { ResetPasswordComponent } from './core/auth/reset-password/reset-password.component'; // 👈 Import nuevo

export const routes: Routes = [
  //{ path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },

  // 👇 Nueva ruta para restablecer contraseña
  { path: 'reset-password', component: ResetPasswordComponent },

  {
    path: 'inicio',
    // canActivate: [AuthGuard],
    component: MenulateralComponent,
    children: [
      { path: '', component: InicioComponent, pathMatch: 'full' },
      { path: 'sobres', component: SobresComponent },
      { path: 'certificados', component: CertificadosComponent },
      { path: 'firmantes', component: FirmantesComponent },
      { path: 'reportes', component: ReportesComponent },
      { path: 'analisis', component: AnalisisComponent },
      { path: 'ajustes', component: AjustesComponent },
      { path: 'ayuda', component: AyudaComponent },
    ]
  },

  { path: '**', redirectTo: 'login' },
];
