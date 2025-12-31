import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FirebaseCrudService } from '../../../../core/services/firebase-crud.service';
import { SweetAlert } from '../../../../core/services/sweet-alert';
import { where } from '@angular/fire/firestore';

interface Certificados {
  cliente: string;
  numero: string;
  operador: string;
  tipo: string;
  estado: string;
  scratch: string;
  dni: string;
  telefono: string;
  fechaEmision: string;
  fechaVencimiento: string;
}

@Component({
  selector: 'app-certificados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './certificados.component.html',
  styleUrls: ['./certificados.component.css']
})
export class CertificadosComponent implements OnInit {
  private firebaseCrud = inject(FirebaseCrudService);
  private swal = inject(SweetAlert);

  allCerts: Certificados[] = [];
  certsView: Certificados[] = [];

  // filtros
  searchTerm = '';
  filterOperador = '';
  filterEstado = '';
  filterTipo = '';
  filterTel = '';
  startDate?: string;
  endDate?: string;

  // paginación
  pageSize = 20;
  currentPage = 1;
  totalPages = 1;

  operadores: string[] = [];
  tipos = ['OneShot','Larga Duracion'];
  estados = ['En Proceso','Finalizado','Rechazado','Caducado','Cancelado'];

  async ngOnInit() {
    // Cargar todos los certificados de Firebase al iniciar
    await this.loadCertificadosFromFirebase();
    this.applyFiltersLocal();
  }

    // ---------- Cargar datos reales desde Firebase ----------
    async loadCertificadosFromFirebase(showLoading = true) {
      if (showLoading) {
        this.swal.loading('Cargando certificados...');
      }
      try {
        // Cargar TODOS los certificados sin filtro
        const certificados = await this.firebaseCrud.getAll<any>('certificados');
        this.allCerts = certificados || [];
        if (showLoading) {
          this.swal.close();
        }
      } catch {
        this.allCerts = [];
        if (showLoading) {
          this.swal.close();
        }
      }
    }

  // utilidades
  pick<T>(arr:T[]):T { return arr[Math.floor(Math.random()*arr.length)]; }

  randomWeighted<T>(arr: T[], weights: number[]): T {
    const total = weights.reduce((a,b)=>a+b,0);
    let r = Math.random()*total;
    for(let i=0;i<arr.length;i++){
      if(r<weights[i]) return arr[i];
      r-=weights[i];
    }
    return arr[0];
  }

  randomWorkday(start: Date, end: Date): Date {
    let date;
    do {
      const t = start.getTime() + Math.random() * (end.getTime()-start.getTime());
      date = new Date(t);
    } while (date.getDay()===0 || date.getDay()===6);
    return date;
  }

  formatDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  addDays(dateStr:string,days:number):string{
    const [d,m,y] = dateStr.split('/').map(Number);
    const dte = new Date(2000+y,m-1,d);
    dte.setDate(dte.getDate()+days);
    return this.formatDate(dte);
  }
  addYears(dateStr:string,years:number):string{
    const [d,m,y] = dateStr.split('/').map(Number);
    const dte = new Date(2000+y,m-1,d);
    dte.setFullYear(dte.getFullYear()+years);
    return this.formatDate(dte);
  }

  genDNI():string{
    const dep = String(1+Math.floor(Math.random()*18)).padStart(2,'0');
    const two = String(Math.floor(Math.random()*100)).padStart(2,'0');
    const year = String(50+Math.floor(Math.random()*50)); // nacimiento entre 1950-1999
    const rest = String(Math.floor(Math.random()*100000)).padStart(5,'0');
    return dep+two+year+rest;
  }

  genTel():string{
    const prefijos = ['9','8','3'];
    const p = this.pick(prefijos);
    return '+504'+p+String(Math.floor(Math.random()*10000000)).padStart(7,'0');
  }

  // -------- Filtros --------
  // Filtra solo localmente sin recargar Firebase - para búsqueda instantánea
  applyFiltersLocal() {
    let result = [...this.allCerts];
    if(this.searchTerm){
      result = result.filter(c=> c.cliente.toLowerCase().includes(this.searchTerm.toLowerCase()));
    }
    if(this.filterOperador){
      result = result.filter(c=> c.operador===this.filterOperador);
    }
    if(this.filterEstado){
      result = result.filter(c=> c.estado===this.filterEstado);
    }
    if(this.filterTipo){
      result = result.filter(c=> c.tipo===this.filterTipo);
    }
    if(this.filterTel){
      if(this.filterTel==='TIGO'){
        result = result.filter(c=> c.telefono.startsWith('+5049'));
      } else {
        result = result.filter(c=> c.telefono.startsWith('+5048') || c.telefono.startsWith('+5043'));
      }
    }
    this.totalPages = Math.ceil(result.length/this.pageSize);
    this.currentPage = 1;
    this.certsView = result.slice(0,this.pageSize);
  }

  // Solo filtra localmente, sin recargar de Firebase
  applyFilters() {
    this.applyFiltersLocal();
  }

  changePage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
    const start = (p - 1) * this.pageSize;
    const end = start + this.pageSize;
    const filtered = this.getFiltered();
    this.certsView = filtered.slice(start, end);
  }

  clearFilters(){
    this.searchTerm = '';
    this.filterOperador = '';
    this.filterEstado = '';
    this.filterTipo = '';
    this.filterTel = '';
    this.startDate = undefined;
    this.endDate = undefined;
    this.applyFiltersLocal();
  }

  getFiltered(){
    let result = [...this.allCerts];
    if(this.searchTerm){
      result = result.filter(c=> c.cliente.toLowerCase().includes(this.searchTerm.toLowerCase()));
    }
    if(this.filterOperador){
      result = result.filter(c=> c.operador===this.filterOperador);
    }
    if(this.filterEstado){
      result = result.filter(c=> c.estado===this.filterEstado);
    }
    if(this.filterTipo){
      result = result.filter(c=> c.tipo===this.filterTipo);
    }
    if(this.filterTel){
      if(this.filterTel==='TIGO'){
        result = result.filter(c=> c.telefono.startsWith('+5049'));
      } else {
        result = result.filter(c=> c.telefono.startsWith('+5048') || c.telefono.startsWith('+5043'));
      }
    }
    return result;
  }

  // -------- Exportaciones --------
  exportCSV(){
    const rows = this.getFiltered().map(c=>[c.cliente,c.numero,c.operador,c.tipo,c.estado,c.scratch,c.dni,c.telefono,c.fechaEmision,c.fechaVencimiento]);
    const header = ['Cliente','Certificado','Operador','Tipo','Estado','Scratch','DNI','Telefono','Emision','Vencimiento'];
    const csv = [header,...rows].map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const a = document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='certificados.csv';
    a.click();
  }

  exportXLSX(){
    const data = this.getFiltered();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,'Certificados');
    XLSX.writeFile(wb,'certificados.xlsx');
  }

  exportPDF(){
    const doc = new jsPDF({unit:'pt',format:'a4'});
    doc.setFontSize(14);
    doc.text('Certificados',40,40);
    const body = this.getFiltered().map(c=>[c.cliente,c.numero,c.operador,c.tipo,c.estado,c.scratch,c.dni,c.telefono,c.fechaEmision,c.fechaVencimiento]);
    autoTable(doc,{
      startY:60,
      head:[['Cliente','Certificado','Operador','Tipo','Estado','Scratch','DNI','Telefono','Emision','Vencimiento']],
      body,
      styles:{fontSize:8},
      headStyles:{fillColor:[0,193,212]}
    });
    doc.save('certificados.pdf');
  }

}
