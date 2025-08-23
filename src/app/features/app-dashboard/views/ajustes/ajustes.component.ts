import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Auth } from '@angular/fire/auth';

import { UsersService,UserProfile,Role } from '@app/core/services/users.service';
import { AuthService } from '@app/core/services/auth.service';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { SweetAlert } from '@app/core/services/sweet-alert';

type SortMode = 'az' | 'za' | 'role';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ajustes.component.html',
  styleUrls: ['./ajustes.component.css']
})
export class AjustesComponent implements OnInit, OnDestroy {
  private usersSrv = inject(UsersService);
  private authSrv = inject(AuthService);
  private auth = inject(Auth);
  private sanitizer = inject(DomSanitizer);


  constructor(private readonly sweetAlert : SweetAlert){

  }
  
  // Header
  title = 'Ajustes';

  // Perfil (izquierda)
  me: UserProfile | null = null;
  firstName = '';
  lastName = '';
  position = '';
  department = '';
  previewPhoto?: SafeUrl;

  // Foto
  uploading = false;
  showCamera = false;
  videoStream?: MediaStream;

  // Contraseña
  currentPassword = '';
  confirmPassword = '';
  newPassword = '';
  changing = false;
  passMsg = '';

  // Crear usuario (admin)
  isAdmin = false;
  cu_firstName = '';
  cu_lastName = '';
  cu_position = '';
  cu_department = '';
  cu_email = '';
  cu_role: Role = 'lector';
  savingUser = false;

  // Modal Usuarios
  showUsers = false;
  users: UserProfile[] = [];
  usersView: UserProfile[] = [];
  sortMode: SortMode = 'az';

  async ngOnInit() {
    this.me = await this.usersSrv.getMyProfile();
    if (this.me) {
      this.firstName = this.me.firstName ?? '';
      this.lastName = this.me.lastName ?? '';
      this.position = this.me.position ?? '';
      this.department = this.me.department ?? '';
      this.isAdmin = this.me.role === 'admin';
    }
  }

  ngOnDestroy(): void {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(t => t.stop());
    }
  }

  // ---------- PERFIL ----------
  async updateProfile() {
    if (!this.auth.currentUser) return;
    const uid = this.auth.currentUser.uid;
    try {
      this.sweetAlert.loading('Guardando perfil...');
      await this.usersSrv.upsertProfile({
        uid,
        firstName: this.firstName.trim(),
        lastName: this.lastName.trim(),
        position: this.position.trim(),
        department: this.department.trim(),
      });
      this.me = await this.usersSrv.getMyProfile();
      this.sweetAlert.success('Perfil actualizado');
    } catch (e: any) {
      this.sweetAlert.error(e?.message ?? 'No se pudo actualizar el perfil');
    } 
  }

  onFileSelect(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.previewPhoto = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file));
    this.uploadAvatar(file);
  }

  async uploadAvatar(file: File | Blob) {
    if (!this.auth.currentUser) return;
    this.uploading = true;
    try {
      this.sweetAlert.loading('Subiendo foto...');
      await this.usersSrv.uploadAvatar(file, this.auth.currentUser.uid);
      this.me = await this.usersSrv.getMyProfile();
      this.sweetAlert.toast('Foto actualizada', 'success');
    } catch (e: any) {
      this.sweetAlert.error(e?.message ?? 'No se pudo subir la foto');
    } finally {
      this.uploading = false;
     
    }
  }

  async openCamera() {
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      this.showCamera = true;
      setTimeout(() => {
        const video = document.getElementById('videoCam') as HTMLVideoElement;
        if (video) video.srcObject = this.videoStream!;
      });
    } catch {
      this.sweetAlert.error('No se pudo acceder a la cámara');
    }
  }

  capturePhoto() {
    const video = document.getElementById('videoCam') as HTMLVideoElement;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        this.previewPhoto = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));
        this.uploadAvatar(blob);
      }
      this.closeCamera();
    }, 'image/jpeg', 0.9);
  }

  closeCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(t => t.stop());
      this.videoStream = undefined;
    }
    this.showCamera = false;
  }

  // ---------- CONTRASEÑA ----------
  async changePassword() {
    this.passMsg = '';
    if (this.newPassword.length < 6) {
      this.passMsg = 'La nueva contraseña debe tener al menos 6 caracteres.';
      this.sweetAlert.warning(this.passMsg);
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passMsg = 'La contraseña nueva y su confirmación no coinciden.';
      this.sweetAlert.warning(this.passMsg);
      return;
    }
    this.changing = true;
    try {
      this.sweetAlert.loading('Actualizando contraseña...');
      await this.authSrv.changePassword(this.currentPassword, this.newPassword);
      this.passMsg = 'Contraseña actualizada correctamente.';
      this.sweetAlert.success(this.passMsg);
      this.currentPassword = this.confirmPassword = this.newPassword = '';
    } catch (e: any) {
      this.passMsg = e?.message ?? 'Error al cambiar la contraseña.';
      this.sweetAlert.error(this.passMsg);
    } finally {
      this.changing = false;
    
      
    }
  }

  // ---------- CREAR USUARIO (admin) ----------
  async createUser() {
    if (!this.isAdmin) return;
    if (!this.cu_email) {
      this.sweetAlert.warning('Correo es obligatorio');
      return;
    }
    this.savingUser = true;
    try {
      this.sweetAlert.loading('Creando usuario...');
      const tempPass = Math.random().toString(36).slice(-10) + 'A1!';
      const res = await this.authSrv.adminCreateUser(this.cu_email, tempPass);
      const uid = res.localId;

      await this.usersSrv.upsertProfile({
        uid,
        email: this.cu_email,
        firstName: this.cu_firstName.trim(),
        lastName: this.cu_lastName.trim(),
        position: this.cu_position.trim(),
        department: this.cu_department.trim(),
        role: this.cu_role,
        active: true,
      });

      await this.authSrv.resetPassword(this.cu_email);
      this.sweetAlert.success('Usuario creado y correo de restablecimiento enviado.');

      // limpia
      this.cu_firstName = this.cu_lastName = this.cu_position = this.cu_department = this.cu_email = '';
      this.cu_role = 'lector';
    } catch (e: any) {
      const msg = e?.error?.error?.message || e?.message || 'Error al crear usuario';
      this.sweetAlert.error(msg);
    } finally {
      this.savingUser = false;
      
    }
  }

  // ---------- MODAL USUARIOS ----------
  async openUsersModal() {
    if (!this.isAdmin) return;
    try {
      this.sweetAlert.loading('Cargando usuarios...');
      this.users = await this.usersSrv.listAll();
      this.applySort('az');
      this.showUsers = true;
    } catch (e: any) {
      this.sweetAlert.error(e?.message ?? 'No se pudieron cargar los usuarios');
    } finally {
     this.sweetAlert.close();
    }
  }

  closeUsersModal() { this.showUsers = false; }

  applySort(mode: SortMode) {
    this.sortMode = mode;
    const arr = [...this.users];
    if (mode === 'az') {
      arr.sort((a,b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'es'));
    } else if (mode === 'za') {
      arr.sort((a,b) => `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`, 'es'));
    } else {
      arr.sort((a,b) => (a.role || '').localeCompare(b.role || '', 'es'));
    }
    this.usersView = arr;
  }

  async saveInline(u: UserProfile) {
    try {
      this.sweetAlert.loading('Guardando cambios...');
      await this.usersSrv.updateUser(u.uid, u);
      this.sweetAlert.success('Usuario actualizado');
    } catch (e: any) {
      this.sweetAlert.error(e?.message ?? 'No se pudo actualizar el usuario');
    } finally {
      
    }
  }

  async deactivate(u: UserProfile) {
    const result = await this.sweetAlert.confirm(
      'Confirmar',
      `¿Eliminar el acceso de ${u.firstName} ${u.lastName}?`,
      'Sí, eliminar',
      'Cancelar'
    );
    if (!result.isConfirmed) return;

    try {
      this.sweetAlert.loading('Desactivando usuario...');
      await this.usersSrv.deactivateUser(u.uid);
      u.active = false;
      this.sweetAlert.success('Usuario desactivado (no podrá ingresar).');
    } catch (e: any) {
      this.sweetAlert.error(e?.message ?? 'No se pudo desactivar el usuario');
    } finally {
     
    }
  }

  // ---------- EXPORTACIONES ----------
  exportCSV() {
    const rows = this.usersView.map(u => [u.firstName, u.lastName, u.email, u.role, u.position || '', u.department || '', u.active ? 'Sí' : 'No']);
    const header = ['Nombres','Apellidos','Correo','Rol','Puesto','Departamento','Activo'];
    const csv = [header, ...rows].map(r => r.map(x => `"${(x ?? '').toString().replaceAll('"','""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'usuarios.csv';
    a.click();
    this.sweetAlert.toast('CSV generado', 'success');
  }

  exportXLSX() {
    const data = this.usersView.map(u => ({
      Nombres: u.firstName,
      Apellidos: u.lastName,
      Correo: u.email,
      Rol: u.role,
      Puesto: u.position || '',
      Departamento: u.department || '',
      Activo: u.active ? 'Sí' : 'No',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    XLSX.writeFile(wb, 'usuarios.xlsx');
    this.sweetAlert.toast('Excel generado', 'success');
  }

  exportPDF() {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFontSize(14);
    doc.text('Usuarios', 40, 40);
    const body = this.usersView.map(u => [
      u.firstName, u.lastName, u.email, u.role, u.position || '', u.department || '', u.active ? 'Sí' : 'No'
    ]);
    autoTable(doc, {
      startY: 60,
      head: [['Nombres','Apellidos','Correo','Rol','Puesto','Departamento','Activo']],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0,56,101] } // #003865
    });
    doc.save('usuarios.pdf');
    this.sweetAlert.toast('PDF generado', 'success');
  }
}
