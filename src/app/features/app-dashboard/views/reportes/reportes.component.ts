import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportType = 'general' | 'sobres' | 'firmantes' | 'certificados' | 'comparativo' | 'auditoria';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit {
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
  pageSize = 5;
  currentPage = 1;
  totalPages = 1;

  estados = ['En Proceso','Finalizado','Rechazado','Caducado','Cancelado'];
  remitentes = ['Abimelec Garcia Galeas','Carlos Lopez','Ana Torres','David Martinez','Julissa Villalobos','Lucia Ramos','Pedro Castillo','Sofia Mendez'];

  procesos = ['Desembolso Extrafinanciamiento','Apertura Cuenta Web','Apertura Cuenta Ahorro','Apertura Cliente Natural','Apertura Cliente Jurídico'];
  firmas = ['OneShot','Clic al Tocar','Biométrica','Larga Duración'];

  ngOnInit() {
    this.generateData(200);
    this.changeReport('general');
  }

  // ---------- Generador de datos ----------
  generateData(count: number) {
    const nombres = ['Carlos','Ana','David','Lucia','Pedro','Sofia','Jorge','Elena'];
    const apellidos = ['Garcia','Lopez','Perez','Torres','Martinez','Ramos','Castillo','Mendez'];

    const arr:any[] = [];
    for (let i = 0; i < count; i++) {
      const cliente = `${this.pick(nombres)} ${this.pick(apellidos)} ${this.pick(apellidos)}`;
      arr.push({
        firmante: cliente,
        emailFirmante: cliente.toLowerCase().replace(/ /g,'.')+'@mail.com',
        dni: this.genDNI(),
        telefono: this.genTel(),
        nombreSobre: `${this.pick(this.procesos).replace(/ /g,'')}_${this.randomDate()}_${cliente}`,
        documentos: this.pick([1,2,4,5,6,8,10]),
        tipoFirma: this.pick(this.firmas),
        estadoSobre: this.pick(this.estados),
        certificado: String(100000 + Math.floor(Math.random()*900000)),
        scratch: String(10000000 + Math.floor(Math.random()*90000000)),
        remitente: this.pick(this.remitentes),
        emailRemitente: 'remitente@firma.com',
        fecha: this.formatDate(this.randomWorkday(new Date(2025,0,1), new Date(2025,7,22))),
        tipoCertificado: this.pick(['OneShot','Larga Duracion']),
        fechaVencimiento: this.formatDate(this.randomWorkday(new Date(2025,8,1), new Date(2026,7,22)))
      });
    }
    this.allData = arr;
  }

  pick<T>(arr:T[]):T { return arr[Math.floor(Math.random()*arr.length)]; }

  genDNI(): string {
    return String(1+Math.floor(Math.random()*18)).padStart(2,'0')+
           String(Math.floor(Math.random()*100)).padStart(2,'0')+
           String(50+Math.floor(Math.random()*50))+
           String(Math.floor(Math.random()*100000)).padStart(5,'0');
  }

  genTel(): string {
    const prefijos = ['9','8','3'];
    return '+504' + this.pick(prefijos) + String(Math.floor(Math.random()*10000000)).padStart(7,'0');
  }

  randomDate(): string {
    const d = Math.floor(Math.random()*28)+1;
    const m = Math.floor(Math.random()*8)+1;
    return `${d.toString().padStart(2,'0')}${m.toString().padStart(2,'0')}25`;
  }

  randomWorkday(start: Date, end: Date): Date {
    let date;
    do {
      const t = start.getTime() + Math.random() * (end.getTime() - start.getTime());
      date = new Date(t);
    } while (date.getDay()===0 || date.getDay()===6);
    return date;
  }

  formatDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  }

  // ---------- Reportes ----------
  changeReport(type: ReportType) {
    this.currentReport = type;
    this.pageSize = type === 'general' ? 5 : 20;

    if (type === 'general') {
      this.columns = ['firmante','emailFirmante','dni','telefono','nombreSobre','documentos','tipoFirma','estadoSobre','certificado','scratch','remitente','emailRemitente','fecha'];
      this.applyFilters();
    }
    if (type === 'sobres') {
      this.columns = ['nombreSobre','firmante','fecha','estadoSobre','tipoFirma','remitente'];
      this.applyFilters();
    }
    if (type === 'firmantes') {
      this.columns = ['firmante','emailFirmante','dni','telefono','documentos'];
      this.applyFilters();
    }
    if (type === 'certificados') {
      this.columns = ['certificado','tipoCertificado','scratch','firmante','remitente','estadoSobre','fechaVencimiento'];
      this.applyFilters();
    }
    if (type === 'comparativo') {
      this.generateComparativo();
    }
    if (type === 'auditoria') {
      this.columns = ['firmante','nombreSobre','remitente','fecha','tipoFirma'];
      this.applyFilters();
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
  applyFilters() {
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
    if (this.startDate && this.endDate) {
      result = result.filter(r => {
        const [d,m,y] = r.fecha.split('/').map(Number);
        const date = new Date(y,m-1,d);
        return date >= new Date(this.startDate!) && date <= new Date(this.endDate!);
      });
    }
    this.totalPages = Math.ceil(result.length/this.pageSize);
    this.currentPage = 1;
    this.reportsView = result.slice(0,this.pageSize);
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
    if (this.startDate && this.endDate) {
      result = result.filter(r => {
        const [d,m,y] = r.fecha.split('/').map(Number);
        const date = new Date(y,m-1,d);
        return date >= new Date(this.startDate!) && date <= new Date(this.endDate!);
      });
    }
    return result;
  }

  clearFilters() {
    this.searchTerm = '';
    this.filterEstado = '';
    this.filterRemitente = '';
    this.startDate = undefined;
    this.endDate = undefined;
    this.applyFilters();
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
