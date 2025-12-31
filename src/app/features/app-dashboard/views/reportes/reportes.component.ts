import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FirebaseCrudService } from '../../../../core/services/firebase-crud.service';
import { SweetAlert } from '../../../../core/services/sweet-alert';

type ReportType = 'general' | 'sobres' | 'firmantes' | 'certificados' | 'comparativo' | 'auditoria';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit {
  private firebaseCrud = inject(FirebaseCrudService);
  private swal = inject(SweetAlert);

  allData: any[] = [];
  reportsView: any[] = [];

  columns: string[] = [];
  currentReport: ReportType = 'general';

  // filtros
  searchTerm = '';
  startDate?: string;
  endDate?: string;
  filterEstado = '';
  filterRemitente = '';

  // paginación
  pageSize = 200;
  currentPage = 1;
  totalPages = 1;

  estados = ['En Proceso','Finalizado','Rechazado','Caducado','Cancelado'];
  remitentes = ['Abimelec Garcia Galeas','Carlos Lopez','Ana Torres','David Martinez','Julissa Villalobos','Lucia Ramos','Pedro Castillo','Sofia Mendez'];

  procesos = ['Desembolso Extrafinanciamiento','Apertura Cuenta Web','Apertura Cuenta Ahorro','Apertura Cliente Natural','Apertura Cliente Jurídico'];
  firmas = ['OneShot','Clic al Tocar','Biométrica','Larga Duración'];

  async ngOnInit() {
    // Cargar todos los reportes de Firebase al iniciar
    await this.loadDataFromFirebase();
    this.changeReport('general');
  }

  // ---------- Cargar datos desde Firebase ----------
  async loadDataFromFirebase(showLoading = true) {
    if (showLoading) {
      this.swal.loading('Cargando reportes...');
    }
    try {
      // Cargar TODOS los reportes sin filtro
      const reportes = await this.firebaseCrud.getAll<any>('reportes');
      this.allData = reportes || [];
      if (showLoading) {
        this.swal.close();
      }
    } catch {
      this.allData = [];
      if (showLoading) {
        this.swal.close();
      }
    }
  }

  // ---------- Reportes ----------
  changeReport(type: ReportType) {
    this.currentReport = type;
    this.pageSize = type === 'general' ? 5 : 20;

    if (type === 'general') {
      this.columns = ['firmante','emailFirmante','dni','telefono','nombreSobre','documentos','tipoFirma','estadoSobre','certificado','scratch','remitente','emailRemitente','fecha'];
      this.applyFiltersLocal();
    }
    if (type === 'sobres') {
      this.columns = ['nombreSobre','firmante','fecha','estadoSobre','tipoFirma','remitente'];
      this.applyFiltersLocal();
    }
    if (type === 'firmantes') {
      this.columns = ['firmante','emailFirmante','dni','telefono','documentos'];
      this.applyFiltersLocal();
    }
    if (type === 'certificados') {
      this.columns = ['certificado','tipoCertificado','scratch','firmante','remitente','estadoSobre','fechaVencimiento'];
      this.applyFiltersLocal();
    }
    if (type === 'comparativo') {
      this.generateComparativo();
    }
    if (type === 'auditoria') {
      this.columns = ['firmante','nombreSobre','remitente','fecha','tipoFirma'];
      this.applyFiltersLocal();
    }
  }

  generateComparativo() {
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto'];
    const arr:any[] = [];
    for (let mes of meses) {
      const row:any = { Mes: mes };
      for (let proc of this.procesos) {
        row[proc] = Math.floor(Math.random()*50)+1;
      }
      arr.push(row);
    }
    this.columns = ['Mes', ...this.procesos];
    this.reportsView = arr;
    this.totalPages = 1;
  }

  // ---------- Filtros ----------
  applyFiltersLocal() {
    let result = [...this.allData];
    if (this.searchTerm) {
      result = result.filter(r => r.firmante.toLowerCase().includes(this.searchTerm.toLowerCase()));
    }
    if (this.filterEstado) {
      result = result.filter(r => r.estadoSobre === this.filterEstado);
    }
    if (this.filterRemitente) {
      result = result.filter(r => r.remitente === this.filterRemitente);
    }
    this.totalPages = Math.ceil(result.length/this.pageSize);
    this.currentPage = 1;
    this.reportsView = result.slice(0,this.pageSize);
  }

  applyFilters() {
    this.applyFiltersLocal();
  }

  changePage(p:number) {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
    const start = (p-1)*this.pageSize;
    const end = start+this.pageSize;
    const filtered = this.getFiltered();
    this.reportsView = filtered.slice(start,end);
  }

  getFiltered() {
    let result = [...this.allData];
    if (this.searchTerm) {
      result = result.filter(r => r.firmante.toLowerCase().includes(this.searchTerm.toLowerCase()));
    }
    if (this.filterEstado) {
      result = result.filter(r => r.estadoSobre === this.filterEstado);
    }
    if (this.filterRemitente) {
      result = result.filter(r => r.remitente === this.filterRemitente);
    }
    return result;
  }

  clearFilters() {
    this.searchTerm = '';
    this.filterEstado = '';
    this.filterRemitente = '';
    this.startDate = undefined;
    this.endDate = undefined;
    this.applyFiltersLocal();
  }

  // ---------- Exportaciones ----------
  exportCSV() {
    const rows = this.currentReport==='comparativo' ? this.reportsView : this.getFiltered();
    const csv = [this.columns.join(','), ...rows.map(r => this.columns.map(c => r[c]).join(','))].join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${this.currentReport}_reporte.csv`;
    a.click();
  }

  exportXLSX() {
    const rows = this.currentReport==='comparativo' ? this.reportsView : this.getFiltered();
    const data = rows.map(r => {
      const obj:any = {};
      this.columns.forEach(c => obj[c] = r[c]);
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,'Reporte');
    XLSX.writeFile(wb,`${this.currentReport}_reporte.xlsx`);
  }

  exportPDF() {
    const doc = new jsPDF({unit:'pt',format:'a4'});
    doc.setFontSize(14);
    doc.text(`Reporte: ${this.currentReport}`,40,40);

    const rows = this.currentReport==='comparativo' ? this.reportsView : this.getFiltered();
    const body = rows.map(r => this.columns.map(c => r[c]));

    autoTable(doc,{
      startY:60,
      head:[this.columns.map(c => this.capitalize(c))],
      body,
      styles:{fontSize:7},
      headStyles:{fillColor:[0,56,101]}
    });
    doc.save(`${this.currentReport}_reporte.pdf`);
  }

  capitalize(text:string):string {
    return text.charAt(0).toUpperCase()+text.slice(1);
  }
}
