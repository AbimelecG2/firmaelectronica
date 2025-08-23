import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

// 👇 Importa tus servicios (rutas relativas desde /core/layout/menulateral)
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

type MenuItem = {
  label: string;
  icon: string;      // clases de Font Awesome (fas/fa-solid etc.)
  route?: string;    // ruta del router
  exact?: boolean;   // coincidencia exacta
  action?: 'logout'; // acción especial
};

@Component({
  selector: 'app-menulateral',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menulateral.component.html',
  styleUrls: ['./menulateral.component.css']
})
export class MenulateralComponent implements OnInit {
  private usersSrv = inject(UsersService);
  private authSrv = inject(AuthService);
  private router = inject(Router);

  private sub?: Subscription;
  
  userName = '';                
  photoURL = 'assets/avatar.png';


  menu: MenuItem[] = [
    { label: 'Inicio',        icon: 'fas fa-home',            route: '/inicio',               exact: true },
    { label: 'Sobres',        icon: 'fas fa-envelope',        route: '/inicio/sobres' },
    { label: 'Certificados',  icon: 'fas fa-certificate',     route: '/inicio/certificados' },
    { label: 'Firmantes',     icon: 'fas fa-users',           route: '/inicio/firmantes' },
    { label: 'Reportes',      icon: 'fas fa-file-alt',        route: '/inicio/reportes' },
    { label: 'Análisis',      icon: 'fas fa-chart-line',      route: '/inicio/analisis' },
    { label: 'Ajustes',       icon: 'fas fa-cog',             route: '/inicio/ajustes' },
    { label: 'Ayuda',         icon: 'fas fa-question-circle', route: '/inicio/ayuda' },
    { label: 'Cerrar sesión', icon: 'fas fa-sign-out-alt',    action: 'logout' }
  ];

  ngOnInit(): void {
   
    this.sub = this.usersSrv.observeMyProfile().subscribe(me => {
      if (me) {
        this.userName = `${me.firstName ?? ''} ${me.lastName ?? ''}`.trim() || me.email || 'Usuario';
        this.photoURL = me.photoURL || 'assets/avatar.png';
      } else {
        this.userName = 'Usuario';
        this.photoURL = 'assets/avatar.png';
      }
    });
  }

  async onLogout(): Promise<void> {
    await this.authSrv.logout();
    this.router.navigate(['/login']);
  }
}
