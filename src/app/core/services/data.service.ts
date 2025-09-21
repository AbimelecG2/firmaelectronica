import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  sobres: any[] = [];
  certificados: any[] = [];
  firmantes: any[] = [];

  constructor() {
    this.generateSobres(400);
    this.generateCertificados(300);
    this.generateFirmantes(400);
  }

  private generateSobres(count: number) {
    const estados = ['En Proceso', 'Finalizado', 'Rechazado', 'Caducado', 'Cancelado'];
    const firmas = ['OneShot', 'Clic al tocar', 'Biometrica', 'Larga Duracion'];
    const procesos = [
      'Desembolso',
      'Apertura Cuenta Web',
      'Apertura Ahorro',
      'Cliente Jurídico',
      'Cliente Natural'
    ];
    const remitentes = ['Abimelec Garcia Galeas', 'Carlos Lopez', 'Ana Torres', 'Pedro Castillo'];

    for (let i = 0; i < count; i++) {
      const fecha = this.randomDate();
      const cliente = `Cliente ${i + 1}`;
      this.sobres.push({
        nombre: `${this.pick(procesos)}_${fecha}_${cliente}`,
        cliente,
        fecha,
        remitente: this.pick(remitentes),
        estado: this.pick(estados),
        firma: this.pick(firmas),
        documentos: [1, 2, 4, 5, 6, 8, 10, 12, 14, 16][Math.floor(Math.random() * 10)]
      });
    }
  }

  private generateCertificados(count: number) {
    const tipos = ['OneShot', 'Larga Duracion'];
    const estados = ['En Proceso', 'Finalizado', 'Rechazado', 'Caducado', 'Cancelado'];
    const operadores = ['Abimelec Garcia Galeas', 'Carlos Lopez', 'Ana Torres', 'Pedro Castillo'];

    for (let i = 0; i < count; i++) {
      const cliente = `Cliente ${i + 1}`;
      const fechaEmision = this.randomDate();
      const fechaVencimiento =
        tipos[Math.floor(Math.random() * tipos.length)] === 'OneShot'
          ? this.addDays(fechaEmision, 1)
          : this.addYears(fechaEmision, 1);

      this.certificados.push({
        numero: String(100000 + Math.floor(Math.random() * 900000)),
        tipo: this.pick(tipos),
        estado: this.pick(estados),
        scratch: String(10000000 + Math.floor(Math.random() * 90000000)),
        cliente,
        operador: this.pick(operadores),
        fechaEmision,
        fechaVencimiento
      });
    }
  }

  private generateFirmantes(count: number) {
    const nombres = ['Carlos', 'Ana', 'David', 'Lucia', 'Pedro', 'Sofia', 'Jorge', 'Elena'];
    const apellidos = ['Garcia', 'Lopez', 'Torres', 'Castillo', 'Perez', 'Martinez'];
    for (let i = 0; i < count; i++) {
      const nombre = this.pick(nombres);
      const apellido = this.pick(apellidos);
      this.firmantes.push({
        nombre: `${nombre} ${apellido}`,
        email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}@mail.com`,
        dni: this.genDNI(),
        telefono: this.genTel(),
        documentos: Math.floor(Math.random() * 20) + 1,
        fecha: this.randomDate()
      });
    }
  }

  // 🔹 utilidades
  private pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private randomDate(): string {
    const start = new Date(2025, 0, 1);
    const end = new Date(2025, 7, 22);
    const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).toString().slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  private addDays(dateStr: string, days: number): string {
    const [dd, mm, yy] = dateStr.split('/').map(Number);
    const d = new Date(2000 + yy, mm - 1, dd);
    d.setDate(d.getDate() + days);
    return this.formatDate(d);
  }

  private addYears(dateStr: string, years: number): string {
    const [dd, mm, yy] = dateStr.split('/').map(Number);
    const d = new Date(2000 + yy, mm - 1, dd);
    d.setFullYear(d.getFullYear() + years);
    return this.formatDate(d);
  }

  private formatDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).toString().slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  private genDNI(): string {
    const dep = String(1 + Math.floor(Math.random() * 18)).padStart(2, '0');
    const two = String(Math.floor(Math.random() * 100)).padStart(2, '0');
    const year = String(50 + Math.floor(Math.random() * 50)); // nacimiento entre 1950-1999
    const rest = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    return dep + two + year + rest;
  }

  private genTel(): string {
    const prefijos = ['9', '8', '3'];
    const p = this.pick(prefijos);
    return '+504' + p + String(Math.floor(Math.random() * 10000000)).padStart(7, '0');
  }
}
