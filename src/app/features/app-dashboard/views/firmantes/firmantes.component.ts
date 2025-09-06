import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  ngOnInit() {
    this.generateFirmantes(400);
    this.applyFilters();
  }

  // -------- Generador de datos --------
  generateFirmantes(count: number) {
    const nombres = ['Carlos','Ana','David','Lucia','Pedro','Sofia','Jorge','Elena','Marco','Laura','Luis','Paola','Andres','Marta','Gabriela','Jose','Rosa','Fernando','Gloria','Pablo','Adriana','Diego','Claudia','Raul','Isabel','Mario','Cristina','Hector','Patricia','Sandra','Camilo','Valeria','Esteban','Fabiola','Ramon','Lilian','Ricardo','Noelia','Sebastian','Angela','Martin','Daniela','Gustavo','Carmen','Eduardo','Vanessa','Felipe','Monica','Rodrigo','Karla','Manuel','Silvia','Tomas','Lorena','Mateo','Victoria','Oscar','Alejandra','Nestor','Elsa','Rafael','Roberto','Celeste','Ignacio','Mariana','Hilda','Kevin','Beatriz','Emilio','Diana','Samuel','Cecilia','Francisco','Teresa','Nicolas','Veronica','Hugo','Miriam','Joel','Luz','Milton','Carolina','Sergio','Cristian','Viviana','Alberto','Tatiana','Enrique','Camila','Jonathan','Yesenia','Ulises','Yolanda','Edwin','Natalia','Elias','Ruth','Daniel','Dayana','German','Pamela','Isidro','Flor','Rigoberto','Lionel','Melisa','Gerson','Victor','Omar','Armando','Clara','Alonso','Guillermo','Ernesto','Salvador','Jesus'];
    const apellidos = ['Garcia','Galeas','Lopez','Perez','Torres','Martinez','Ramos','Castillo','Mendez','Alvarez','Gutierrez','Romero','Hernandez','Castro','Medina','Cruz','Mejia','Reyes','Ortiz','Morales','Pineda','Chavez','Flores','Aguilar','Vasquez','Sanchez','Contreras','Benitez','Zuniga','Guzman','Escobar','Carranza','Orellana','Rivas','Figueroa','Ayala','Murillo','Pacheco','Velasquez','Palma','Andino','Corrales','Carcamo','Acosta'];

    const firmantes: Firmante[] = [];
    const start = new Date(2025,0,1);
    const end = new Date(2025,7,22);

    for (let i=0;i<count;i++) {
      const nombre = this.pick(nombres);
      const apellido1 = this.pick(apellidos);
      const apellido2 = this.pick(apellidos);
      const email = `${nombre.toLowerCase()}.${apellido1.toLowerCase()}@mail.com`;
      const telefono = this.genTel();
      const dni = this.genDNI();
      const cantidadFirmas = 1 + Math.floor(Math.random()*30);
      const documentosFirmados = this.pick([1,2,4,5,6,8,10,12,14,16]);
      const fecha = this.formatDate(this.randomWorkday(start,end));
      const proceso = this.pick(this.procesos);

      firmantes.push({
        nombres: nombre,
        apellidos: `${apellido1} ${apellido2}`,
        email,
        telefono,
        dni,
        cantidadFirmas,
        documentosFirmados,
        fecha,
        proceso,
        pruebasVida: {
          anverso: 'assets/dni_anverso.png',
          reverso: 'assets/dni_reverso.png',
          selfie: 'assets/selfie_dni.png'
        }
      });
    }

    this.allFirmantes = firmantes;
  }

  // utils
  pick<T>(arr:T[]):T { return arr[Math.floor(Math.random()*arr.length)]; }

  randomWorkday(start: Date, end: Date): Date {
    let date;
    do {
      const t = start.getTime() + Math.random()*(end.getTime()-start.getTime());
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

  genDNI():string {
    const dep = String(1+Math.floor(Math.random()*18)).padStart(2,'0');
    const two = String(Math.floor(Math.random()*100)).padStart(2,'0');
    const year = String(50+Math.floor(Math.random()*50));
    const rest = String(Math.floor(Math.random()*100000)).padStart(5,'0');
    return dep+two+year+rest;
  }

  genTel():string {
    const prefijos = ['9','8','3'];
    const p = this.pick(prefijos);
    return '+504'+p+String(Math.floor(Math.random()*10000000)).padStart(7,'0');
  }

  // -------- Filtros --------
  applyFilters() {
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
    if(this.startDate && this.endDate){
      result = result.filter(f=>{
        const [d,m,y] = f.fecha.split('/').map(Number);
        const date = new Date(2000+y,m-1,d);
        return date>=new Date(this.startDate!) && date<=new Date(this.endDate!);
      });
    }
    this.totalPages = Math.ceil(result.length/this.pageSize);
    this.currentPage = 1;
    this.firmantesView = result.slice(0,this.pageSize);
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

  changePage(p:number){
    this.currentPage = p;
    const start = (p-1)*this.pageSize;
    const end = start+this.pageSize;
    const filtered = this.getFiltered();
    this.firmantesView = filtered.slice(start,end);
  }

  getFiltered(){
    let result = [...this.allFirmantes];
    return result;
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
