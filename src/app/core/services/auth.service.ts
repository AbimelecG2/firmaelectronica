import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail } from '@angular/fire/auth';
import { HttpClient } from '@angular/common/http';
import { getApp } from 'firebase/app';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private http = inject(HttpClient);

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    return signOut(this.auth);
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const user = this.auth.currentUser;
    if (!user || !user.email) throw new Error('No hay usuario autenticado');
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);
    await updatePassword(user, newPassword);
  }

  resetPassword(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  /**
   * Crea un usuario SIN cerrar tu sesión (vía REST Identity Toolkit).
   * Retorna { localId, email } del usuario creado.
   */
  async adminCreateUser(email: string, tempPassword: string) {
    const apiKey = (getApp().options as any)?.apiKey as string;
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
    const body = { email, password: tempPassword, returnSecureToken: false };
    const res = await this.http.post<{ localId: string; email: string }>(url, body).toPromise();
    return res!;
  }
}
