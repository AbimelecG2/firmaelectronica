import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  ngOnInit() {
    this.generateSobres(400);
    this.applyFilters();
  }

  // --------- Generador de datos simulados ----------
  generateSobres(count: number) {
    const nombres = [
      'Carlos','Ana','David','Julissa','Lucia','Pedro','Sofia','Jorge','Elena','Marco',
      'Laura','Luis','Paola','Andres','Marta','Gabriela','Jose','Rosa','Fernando','Gloria',
      'Pablo','Adriana','Diego','Claudia','Raul','Isabel','Mario','Cristina','Hector','Patricia',
      'Sandra','Camilo','Valeria','Esteban','Fabiola','Ramon','Lilian','Ricardo','Noelia','Sebastian',
      'Angela','Martin','Daniela','Gustavo','Carmen','Eduardo','Vanessa','Felipe','Monica','Rodrigo',
      'Karla','Manuel','Silvia','Tomas','Lorena','Mateo','Victoria','Oscar','Alejandra','Nestor',
      'Elsa','Rafael','Gladis','Roberto','Celeste','Ignacio','Mariana','Hilda','Kevin','Beatriz',
      'Emilio','Diana','Samuel','Cecilia','Francisco','Teresa','Nicolas','Veronica','Hugo','Miriam',
      'Joel','Luz','Milton','Carolina','Sergio','Elsy','Cristian','Viviana','Alberto','Tatiana',
      'Enrique','Camila','Esther','Jonathan','Yesenia','Ulises','Yolanda','Milagro','Edwin','Genesis',
      'Jacobo','Natalia','Byron','Bianca','Elias','Antonia','Ruth','Ciro','Daniel','Dayana',
      'German','Pamela','Isidro','Flor','Rigoberto','Aurora','Lionel','Melisa','Amalia','Gerson',
      'Ingrid','Victor','Pilar','Omar','Paty','Armando','Clara','Alonso','Evelin','Guillermo',
      'Ivette','Ernesto','Emely','Salvador','Rosaura','Maribel','Jesus','Elisa'
    ];

    const apellidos = [
      'Garcia','Galeas','Lopez','Perez','Torres','Martinez','Ramos','Castillo','Mendez','Alvarez',
      'Gutierrez','Romero','Hernandez','Castro','Medina','Cruz','Mejia','Reyes','Ortiz','Morales',
      'Pineda','Chavez','Flores','Aguilar','Vasquez','Sanchez','Contreras','Benitez','Zuniga','Guzman',
      'Cardona','Escobar','Carranza','Orellana','Rivas','Nolasco','Figueroa','Ayala','Murillo','Pacheco',
      'Amador','Perdomo','Velasquez','Palma','Cantarero','Batista','Andino','Corrales','Carcamo','Acosta'
    ];

    // 25 remitentes
    this.remitentes = [
      'Abimelec Garcia Galeas',
      'Carlos Lopez Ramirez','Ana Torres Gomez','David Martinez Castillo','Julissa Villalobos Carcamo',
      'Lucia Ramos Perez','Pedro Castillo Mejia','Sofia Mendez Aguilar','Jorge Alvarez Flores','Elena Gutierrez Reyes',
      'Marco Romero Ortiz','Laura Hernandez Morales','Luis Castillo Pineda','Paola Medina Sanchez','Andres Cruz Lopez',
      'Marta Gonzalez Chavez','Gabriela Lopez Flores','Jose Martinez Mejia','Rosa Torres Benitez','Fernando Reyes Alvarez',
      'Gloria Ortiz Contreras','Pablo Gutierrez Figueroa','Adriana Ramos Nolasco','Diego Fernandez Pineda','Claudia Castillo Guzman'
    ];

    const docsPosibles = [1,2,4,5,6,8,10,12,14,16];
    const sobres: Sobre[] = [];

    const start = new Date(2025,0,1);
    const end = new Date(2025,7,22);

    for(let i=0;i<count;i++){
      const cliente = `${this.pick(nombres)} ${this.pick(apellidos)} ${this.pick(apellidos)}`;
      const fecha = this.randomWorkday(start,end);
      const fechaStr = this.formatDate(fecha);

      const proceso = i < count*0.4 
        ? 'DesembolsoExtrafinanciamiento'
        : this.pick(this.procesos);

      const remitente = this.pick(this.remitentes);

      // estados con pesos (más finalizados y en proceso)
      let estado = this.randomWeighted(this.estados,[4,6,2,2,2]);
      if (i < 30) estado = 'En Proceso'; // asegurar varios en proceso

      const firma = this.randomWeighted(this.firmas,[1,6,1,2]);
      const documentos = this.randomWeighted(docsPosibles,[1,1,6,1,1,2,1,1,1,1]);

      const nombre = `${proceso}_${fechaStr.replace(/\//g,'')}_${cliente}`;
      sobres.push({ nombre, firmante: cliente, fecha: fechaStr, remitente, estado, firma, documentos });
    }

    sobres.sort((a,b)=>{
      const [da,ma,ya] = a.fecha.split('/').map(Number);
      const [db,mb,yb] = b.fecha.split('/').map(Number);
      return new Date(2000+ya,ma-1,da).getTime() - new Date(2000+yb,mb-1,db).getTime();
    });

    this.allSobres = sobres;
  }

  // -------- utilidades --------
  pick<T>(arr:T[]):T { return arr[Math.floor(Math.random()*arr.length)]; }

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

  randomWeighted<T>(arr: T[], weights: number[]): T {
    const total = weights.reduce((a,b)=>a+b,0);
    let r = Math.random()*total;
    for(let i=0;i<arr.length;i++){
      if(r<weights[i]) return arr[i];
      r-=weights[i];
    }
    return arr[0];
  }

  // -------- Filtros --------
  applyFilters() {
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
    this.totalPages = Math.ceil(result.length/this.pageSize);
    this.currentPage = 1;
    this.sobresView = result.slice(0,this.pageSize);
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
