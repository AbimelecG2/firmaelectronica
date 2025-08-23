import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Importa los servicios (rutas relativas desde /core/auth/login/)
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';

  errorMessage = '';
  infoMessage = '';

  constructor(
    private auth: AuthService,
    private users: UsersService,
    private router: Router
  ) {}

  async onLogin() {
    this.errorMessage = '';
    this.infoMessage = '';

    try {
      const cred = await this.auth.login(this.email.trim(), this.password);
      const profile = await this.users.getProfile(cred.user.uid);

      if (!profile || profile.active === false) {
        this.errorMessage = 'Cuenta desactivada o sin perfil. Contacte al administrador.';
        return;
      }

      this.router.navigate(['/inicio']); // navega al shell con tu dashboard
    } catch (e: any) {
      // Mensaje amigable (evita exponer códigos crudos)
      this.errorMessage = 'Correo o contraseña incorrectos, o la cuenta no existe.';
    }
  }

  async onResetPassword() {
    this.errorMessage = '';
    this.infoMessage = '';

    if (!this.email.trim()) {
      this.errorMessage = 'Escribe tu correo para enviarte el enlace de restablecimiento.';
      return;
    }

    try {
      this.infoMessage = 'Enviando correo de restablecimiento…';
      await this.auth.resetPassword(this.email.trim());
      this.infoMessage = 'Te enviamos un correo para restablecer tu contraseña.';
    } catch (e: any) {
      this.errorMessage = 'No se pudo enviar el correo. Verifica el correo ingresado.';
    }
  }
  catch (e: any) {
  // e.code típico: 'auth/user-not-found', 'auth/wrong-password', 'auth/invalid-email', etc.
  this.errorMessage = this.mapAuthError(e?.code);
}

private mapAuthError(code?: string): string {
  switch (code) {
    case 'auth/user-not-found': return 'Ese correo no tiene cuenta en el sistema.';
    case 'auth/wrong-password': return 'Contraseña incorrecta.';
    case 'auth/invalid-email':  return 'Correo inválido.';
    case 'auth/too-many-requests': return 'Demasiados intentos. Intenta más tarde.';
    case 'auth/network-request-failed': return 'Problema de red. Revisa tu conexión.';
    default: return 'No se pudo iniciar sesión. Verifica tus datos.';
  }
}

}
