import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  ngOnInit() {
    this.generateCertificados(300);
    this.applyFilters();
  }

  // ---------- Generador de datos ----------
  generateCertificados(count: number) {
    const nombres = ['Carlos','Ana','David','Lucia','Pedro','Sofia','Jorge','Elena','Marco','Laura','Luis','Paola','Andres','Marta','Gabriela','Jose','Rosa','Fernando','Gloria','Pablo','Adriana','Diego','Claudia','Raul','Isabel','Mario','Cristina','Hector','Patricia','Sandra','Camilo','Valeria','Esteban','Fabiola','Ramon','Lilian','Ricardo','Noelia','Sebastian','Angela','Martin','Daniela','Gustavo','Carmen','Eduardo','Vanessa','Felipe','Monica','Rodrigo','Karla','Manuel','Silvia','Tomas','Lorena','Mateo','Victoria','Oscar','Alejandra','Nestor','Elsa','Rafael','Roberto','Celeste','Ignacio','Mariana','Hilda','Kevin','Beatriz','Emilio','Diana','Samuel','Cecilia','Francisco','Teresa','Nicolas','Veronica','Hugo','Miriam','Joel','Luz','Milton','Carolina','Sergio','Cristian','Viviana','Alberto','Tatiana','Enrique','Camila','Jonathan','Yesenia','Ulises','Yolanda','Edwin','Natalia','Elias','Ruth','Daniel','Dayana','German','Pamela','Isidro','Flor','Rigoberto','Lionel','Melisa','Gerson','Victor','Omar','Armando','Clara','Alonso','Guillermo','Ernesto','Salvador','Jesus'];
    const apellidos = ['Garcia','Galeas','Lopez','Perez','Torres','Martinez','Ramos','Castillo','Mendez','Alvarez','Gutierrez','Romero','Hernandez','Castro','Medina','Cruz','Mejia','Reyes','Ortiz','Morales','Pineda','Chavez','Flores','Aguilar','Vasquez','Sanchez','Contreras','Benitez','Zuniga','Guzman','Escobar','Carranza','Orellana','Rivas','Figueroa','Ayala','Murillo','Pacheco','Velasquez','Palma','Andino','Corrales','Carcamo','Acosta'];

    this.operadores = [
      'Abimelec Garcia Galeas',
      'Carlos Lopez Ramirez','Ana Torres Gomez','David Martinez Castillo','Julissa Villalobos Carcamo',
      'Lucia Ramos Perez','Pedro Castillo Mejia','Sofia Mendez Aguilar','Jorge Alvarez Flores','Elena Gutierrez Reyes',
      'Marco Romero Ortiz','Laura Hernandez Morales','Luis Castillo Pineda','Paola Medina Sanchez','Andres Cruz Lopez',
      'Marta Gonzalez Chavez','Gabriela Lopez Flores','Jose Martinez Mejia','Rosa Torres Benitez','Fernando Reyes Alvarez',
      'Gloria Ortiz Contreras','Pablo Gutierrez Figueroa','Adriana Ramos Nolasco','Diego Fernandez Pineda','Claudia Castillo Guzman'
    ];

    const certs: Certificados[] = [];
    const start = new Date(2025,0,1);
    const end = new Date(2025,7,22);

    for(let i=0;i<count;i++){
      const cliente = `${this.pick(nombres)} ${this.pick(apellidos)} ${this.pick(apellidos)}`;
      const numero = String(100000 + Math.floor(Math.random()*900000));
      const operador = this.pick(this.operadores);
      const tipo = this.pick(this.tipos);
      const estado = this.randomWeighted(this.estados,[3,6,2,2,2]); // mayoría finalizados

      const scratch = String(10000000 + Math.floor(Math.random()*90000000));
      const dni = this.genDNI();
      const telefono = this.genTel();

      const fechaEmision = this.formatDate(this.randomWorkday(start,end));
      let fechaVencimiento = '';
      if(tipo==='OneShot'){
        fechaVencimiento = this.addDays(fechaEmision,1);
      } else {
        fechaVencimiento = this.addYears(fechaEmision,1);
      }

      // 👇 Aquí corregimos, usamos el mismo nombre de la interfaz
      certs.push({cliente,numero,operador,tipo,estado,scratch,dni,telefono,fechaEmision,fechaVencimiento});
    }

    certs.sort((a,b)=>{
      const [da,ma,ya] = a.fechaEmision.split('/').map(Number);
      const [db,mb,yb] = b.fechaEmision.split('/').map(Number);
      return new Date(2000+ya,ma-1,da).getTime() - new Date(2000+yb,mb-1,db).getTime();
    });

    this.allCerts = certs;
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
  applyFilters() {
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
    if(this.startDate && this.endDate){
      result = result.filter(c=>{
        const [d,m,y] = c.fechaEmision.split('/').map(Number);
        const date = new Date(2000+y,m-1,d);
        return date>=new Date(this.startDate!) && date<=new Date(this.endDate!);
      });
    }
    this.totalPages = Math.ceil(result.length/this.pageSize);
    this.currentPage = 1;
    this.certsView = result.slice(0,this.pageSize);
  }

  clearFilters(){
    this.searchTerm = '';
    this.filterOperador = '';
    this.filterEstado = '';
    this.filterTipo = '';
    this.filterTel = '';
    this.startDate = undefined;
    this.endDate = undefined;
    this.applyFilters();
  }

  changePage(p:number){
    this.currentPage = p;
    const start = (p-1)*this.pageSize;
    const end = start+this.pageSize;
    const filtered = this.getFiltered();
    this.certsView = filtered.slice(start,end);
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
    if(this.startDate && this.endDate){
      result = result.filter(c=>{
        const [d,m,y] = c.fechaEmision.split('/').map(Number);
        const date = new Date(2000+y,m-1,d);
        return date>=new Date(this.startDate!) && date<=new Date(this.endDate!);
      });
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
