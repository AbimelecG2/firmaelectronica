import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FirebaseCrudService } from '../../../../core/services/firebase-crud.service';
import { SweetAlert } from '../../../../core/services/sweet-alert';
import { where } from '@angular/fire/firestore';

interface Firmante {
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  dni: string;
  cantidadFirmas: number;
  documentosFirmados: number;
  fecha: string;
  proceso: string;
  pruebasVida: {
    anverso: string;
    reverso: string;
    selfie: string;
  };
}

@Component({
  selector: 'app-firmantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './firmantes.component.html',
  styleUrls: ['./firmantes.component.css']
})
export class FirmantesComponent implements OnInit {
  private firebaseCrud = inject(FirebaseCrudService);
  private swal = inject(SweetAlert);

  allFirmantes: Firmante[] = [];
  firmantesView: Firmante[] = [];

  // filtros
  searchTerm = '';
  sortMode: 'az' | 'za' = 'az';
  filterOperadora = '';
  filterProceso = '';
  startDate?: string;
  endDate?: string;

  // paginación
  pageSize = 20;
  currentPage = 1;
  totalPages = 1;

  procesos = [
    'DesembolsoExtrafinanciamiento',
    'AperturaCuentaWeb',
    'AperturaCuentaAhorro',
    'AperturaClienteNatural',
    'AperturaClienteJuridico'
  ];

  async ngOnInit() {
    // Cargar todos los firmantes de Firebase al iniciar
    await this.loadFirmantesFromFirebase();
    this.applyFiltersLocal();
  }

  // Convierte dd/MM/yy a Date para comparar correctamente
  private parseFirebaseDate(dateStr: string): Date {
    const [day, month, yy] = dateStr.split('/');
    const fullYear = parseInt(yy) < 50 ? `20${yy}` : `19${yy}`;
    return new Date(`${fullYear}-${month}-${day}`);
  }

  // ---------- Cargar datos reales desde Firebase ----------
  async loadFirmantesFromFirebase(showLoading = true) {
    if (showLoading) {
      this.swal.loading('Cargando firmantes...');
    }
    try {
      // Cargar TODOS los firmantes sin filtro
      const firmantes = await this.firebaseCrud.getAll<any>('firmantes');
      this.allFirmantes = firmantes || [];
      if (showLoading) {
        this.swal.close();
      }
    } catch {
      this.allFirmantes = [];
      if (showLoading) {
        this.swal.close();
      }
    }
  }

  
  // -------- Filtros --------
  // Filtra solo localmente sin recargar Firebase - para búsqueda instantánea
  applyFiltersLocal() {
    let result = [...this.allFirmantes];
    if(this.searchTerm){
      result = result.filter(f=> f.nombres.toLowerCase().includes(this.searchTerm.toLowerCase()));
    }
    if(this.sortMode==='az'){
      result.sort((a,b)=> (a.nombres+a.apellidos).localeCompare(b.nombres+b.apellidos,'es'));
    } else {
      result.sort((a,b)=> (b.nombres+b.apellidos).localeCompare(a.nombres+a.apellidos,'es'));
    }
    if(this.filterOperadora==='TIGO'){
      result = result.filter(f=> f.telefono.startsWith('+5049'));
    } else if(this.filterOperadora==='CLARO'){
      result = result.filter(f=> f.telefono.startsWith('+5048') || f.telefono.startsWith('+5043'));
    }
    if(this.filterProceso){
      result = result.filter(f=> f.proceso===this.filterProceso);
    }
    this.totalPages = Math.ceil(result.length/this.pageSize);
    this.currentPage = 1;
    this.firmantesView = result.slice(0,this.pageSize);
  }

  getFiltered() {
    let result = [...this.allFirmantes];
    if(this.searchTerm){
      result = result.filter(f=> f.nombres.toLowerCase().includes(this.searchTerm.toLowerCase()));
    }
    if(this.sortMode==='az'){
      result.sort((a,b)=> (a.nombres+a.apellidos).localeCompare(b.nombres+b.apellidos,'es'));
    } else {
      result.sort((a,b)=> (b.nombres+b.apellidos).localeCompare(a.nombres+a.apellidos,'es'));
    }
    if(this.filterOperadora==='TIGO'){
      result = result.filter(f=> f.telefono.startsWith('+5049'));
    } else if(this.filterOperadora==='CLARO'){
      result = result.filter(f=> f.telefono.startsWith('+5048') || f.telefono.startsWith('+5043'));
    }
    if(this.filterProceso){
      result = result.filter(f=> f.proceso===this.filterProceso);
    }
    return result;
  }

  // Al hacer clic en buscar, solo filtra localmente
  applyFilters() {
    this.applyFiltersLocal();
  }
  changePage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
    const start = (p - 1) * this.pageSize;
    const end = start + this.pageSize;
    const filtered = this.getFiltered();
    this.firmantesView = filtered.slice(start, end);
  }
  clearFilters(){
    this.searchTerm = '';
    this.sortMode = 'az';
    this.filterOperadora = '';
    this.filterProceso = '';
    this.startDate = undefined;
    this.endDate = undefined;
    this.applyFilters();
  }

  // -------- Exportaciones --------
  exportCSV(){
    const rows = this.firmantesView.map(f=>[f.nombres,f.apellidos,f.email,f.telefono,f.dni,f.cantidadFirmas,f.documentosFirmados,f.fecha]);
    const header = ['Nombres','Apellidos','Email','Telefono','DNI','Firmas','Documentos','Fecha'];
    const csv = [header,...rows].map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const a = document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='firmantes.csv';
    a.click();
  }

  exportXLSX(){
    const data = this.firmantesView;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,'Firmantes');
    XLSX.writeFile(wb,'firmantes.xlsx');
  }

  exportPDF(){
    const doc = new jsPDF({unit:'pt',format:'a4'});
    doc.setFontSize(14);
    doc.text('Firmantes',40,40);
    const body = this.firmantesView.map(f=>[f.nombres,f.apellidos,f.email,f.telefono,f.dni,f.cantidadFirmas,f.documentosFirmados,f.fecha]);
    autoTable(doc,{
      startY:60,
      head:[['Nombres','Apellidos','Email','Telefono','DNI','Firmas','Documentos','Fecha']],
      body,
      styles:{fontSize:8},
      headStyles:{fillColor:[0,193,212]}
    });
    doc.save('firmantes.pdf');
  }
}
