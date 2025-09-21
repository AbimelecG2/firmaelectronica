import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // 👈 para usar ngModel
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ManualesService } from '@app/core/services/manuales.service';

type ManualCard = {
  fileName: string;
  displayName: string;
  url: string;
};

@Component({
  selector: 'app-ayuda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ayuda.component.html',
  styleUrls: ['./ayuda.component.css']
})
export class AyudaComponent implements OnInit {
  private manualesSrv = inject(ManualesService);
  private sanitizer = inject(DomSanitizer);

  supportEmail = 'ayuda@firmadigital.com';

  loading = true;
  error = '';
  manuals: ManualCard[] = [];

  // Modal
  showModal = false;
  selectedDisplayName = '';
  selectedUrl = '';
  selectedUrlSafe: SafeResourceUrl | null = null;

  // Comentarios
  userComment = '';
  sending = false;
  successMsg = '';
  errorMsg = '';

  async ngOnInit(): Promise<void> {
    try {
      const items = await this.manualesSrv.list('manuales');
      this.manuals = items.map(m => ({
        fileName: m.name,
        displayName: this.toTitle(m.name),
        url: m.url
      }));
    } catch (e) {
      console.error(e);
      this.error = 'No se pudieron cargar los manuales.';
    } finally {
      this.loading = false;
    }
  }

  openModal(m: ManualCard): void {
    this.selectedDisplayName = m.displayName;
    this.selectedUrl = m.url;
    this.selectedUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(m.url);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedDisplayName = '';
    this.selectedUrl = '';
    this.selectedUrlSafe = null;
  }

  @HostListener('window:keydown.escape')
  onEsc(): void {
    if (this.showModal) this.closeModal();
  }

  trackByFile = (_: number, item: ManualCard) => item.fileName;

  private toTitle(filename: string): string {
    const base = filename.replace(/\.[^/.]+$/, '');
    return base
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1));
  }

  // 👉 Método para enviar comentarios
  async sendComment() {
    this.successMsg = '';
    this.errorMsg = '';

    if (!this.userComment.trim()) {
      this.errorMsg = 'Por favor, escribe un comentario antes de enviarlo.';
      return;
    }

    this.sending = true;
    try {
      // Aquí simulo el envío. Podés integrarlo a Firebase/Email/Backend
      await new Promise(resolve => setTimeout(resolve, 1500));

      this.successMsg = '¡Tu comentario se envió con éxito! ✅';
      this.userComment = '';
    } catch (e) {
      this.errorMsg = 'Ocurrió un error al enviar tu comentario.';
    } finally {
      this.sending = false;
    }
  }
}
