import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FirebaseCrudService } from '../../../../core/services/firebase-crud.service';
import { SweetAlert } from '../../../../core/services/sweet-alert';
import { where } from '@angular/fire/firestore';

interface Sobre {
  nombre: string;
  firmante: string;
  fecha: string; // dd/MM/yy
  remitente: string;
  estado: string;
  firma: string;
  documentos: number;
}

@Component({
  selector: 'app-sobres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sobres.component.html',
  styleUrls: ['./sobres.component.css']
})
export class SobresComponent implements OnInit {
  private firebaseCrud = inject(FirebaseCrudService);
  private swal = inject(SweetAlert);

  allSobres: Sobre[] = [];
  sobresView: Sobre[] = [];

  // filtros
  searchTerm = '';
  filterProceso = '';
  filterRemitente = '';
  filterEstado = '';
  filterFirma = '';
  startDate?: string;
  endDate?: string;

  // paginación
  pageSize = 20;
  currentPage = 1;
  totalPages = 1;

  remitentes: string[] = [];
  procesos = [
    'DesembolsoExtrafinanciamiento',
    'AperturaCuentaWeb',
    'AperturaCuentaAhorro',
    'AperturaClienteNatural',
    'AperturaClienteJuridico'
  ];
  estados = ['En Proceso','Finalizado','Rechazado','Caducado','Cancelado'];
  firmas = ['Clic al Tocar','OneShot','Larga Duracion','Biometrica'];

  async ngOnInit() {
    // Cargar todos los sobres de Firebase al iniciar
    await this.loadSobresFromFirebase();
    this.applyFiltersLocal();
  }

  // ---------- Cargar datos reales desde Firebase ----------
  async loadSobresFromFirebase(showLoading = true) {
    if (showLoading) {
      this.swal.loading('Cargando sobres...');
    }
    try {
      // Cargar TODOS los sobres sin filtro
      const sobres = await this.firebaseCrud.getAll<any>('sobres');
      this.allSobres = sobres || [];
      if (showLoading) {
        this.swal.close();
      }
    } catch { 
      this.allSobres = [];
      if (showLoading) {
        this.swal.close();
      }
    }
  }

  // -------- Filtros --------
  // Filtra solo localmente sin recargar Firebase - para búsqueda instantánea
  applyFiltersLocal() {
    let result = [...this.allSobres];
    if(this.searchTerm){
      result = result.filter(s=> s.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()));
    }
    if(this.filterProceso){
      result = result.filter(s=> s.nombre.startsWith(this.filterProceso));
    }
    if(this.filterRemitente){
      result = result.filter(s=> s.remitente===this.filterRemitente);
    }
    if(this.filterEstado){
      result = result.filter(s=> s.estado===this.filterEstado);
    }
    if(this.filterFirma){
      result = result.filter(s=> s.firma===this.filterFirma);
    }
    this.totalPages = Math.ceil(result.length/this.pageSize);
    this.currentPage = 1;
    this.sobresView = result.slice(0,this.pageSize);
  }

  // Al hacer clic en buscar, recarga desde Firebase con las fechas actuales
  applyFilters() {
    this.applyFiltersLocal();
  }

  clearFilters(){
    this.searchTerm = '';
    this.filterProceso = '';
    this.filterRemitente = '';
    this.filterEstado = '';
    this.filterFirma = '';
    this.startDate = undefined;
    this.endDate = undefined;
    this.applyFilters();
  }

  changePage(p:number){
    this.currentPage = p;
    const start = (p-1)*this.pageSize;
    const end = start+this.pageSize;
    const filtered = this.getFiltered();
    this.sobresView = filtered.slice(start,end);
  }

  getFiltered(){
    let result = [...this.allSobres];
    if(this.searchTerm){
      result = result.filter(s=> s.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()));
    }
    if(this.filterProceso){
      result = result.filter(s=> s.nombre.startsWith(this.filterProceso));
    }
    if(this.filterRemitente){
      result = result.filter(s=> s.remitente===this.filterRemitente);
    }
    if(this.filterEstado){
      result = result.filter(s=> s.estado===this.filterEstado);
    }
    if(this.filterFirma){
      result = result.filter(s=> s.firma===this.filterFirma);
    }
    if(this.startDate && this.endDate){
      result = result.filter(s=>{
        const [d,m,y] = s.fecha.split('/').map(Number);
        const date = new Date(2000+y,m-1,d);
        return date>=new Date(this.startDate!) && date<=new Date(this.endDate!);
      });
    }
    return result;
  }

  // -------- Exportaciones --------
  exportCSV(){
    const rows = this.getFiltered().map(s=>[s.nombre,s.firmante,s.fecha,s.remitente,s.estado,s.firma,s.documentos]);
    const header = ['Nombre','Firmante','Fecha','Remitente','Estado','Firma','Documentos'];
    const csv = [header,...rows].map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const a = document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='sobres.csv';
    a.click();
  }

  exportXLSX(){
    const data = this.getFiltered();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,'Sobres');
    XLSX.writeFile(wb,'sobres.xlsx');
  }

  exportPDF(){
    const doc = new jsPDF({unit:'pt',format:'a4'});
    doc.setFontSize(14);
    doc.text('Sobres',40,40);
    const body = this.getFiltered().map(s=>[s.nombre,s.firmante,s.fecha,s.remitente,s.estado,s.firma,s.documentos]);
    autoTable(doc,{
      startY:60,
      head:[['Nombre','Firmante','Fecha','Remitente','Estado','Firma','Documentos']],
      body,
      styles:{fontSize:9},
      headStyles:{fillColor:[0,193,212]}
    });
    doc.save('sobres.pdf');
  }
}
