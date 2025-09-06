import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {
  email = '';
  errorMessage = '';
  successMessage = '';
  loading = false;

  constructor(private auth: AuthService) {}

  async onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.validateEmail(this.email)) {
      this.errorMessage = 'Por favor, ingresa un correo válido.';
      return;
    }

    this.loading = true;

    try {
      await this.auth.resetPassword(this.email.trim());
      this.successMessage = 'Te hemos enviado un correo con el enlace para restablecer tu contraseña.';
    } catch (error: any) {
      this.errorMessage = this.mapAuthError(error?.code);
    } finally {
      this.loading = false;
    }
  }

  private validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private mapAuthError(code?: string): string {
    switch (code) {
      case 'auth/user-not-found': return 'No existe una cuenta con ese correo.';
      case 'auth/invalid-email': return 'El formato del correo no es válido.';
      case 'auth/network-request-failed': return 'Problema de red. Intenta de nuevo.';
      default: return 'No se pudo enviar el correo. Verifica el correo ingresado.';
    }
  }
}
