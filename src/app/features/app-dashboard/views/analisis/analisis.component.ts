import { DataService } from '@app/core/services/data.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, ChartConfiguration, ChartOptions } from 'chart.js';


Chart.register(...registerables);

@Component({
  selector: 'app-analisis',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './analisis.component.html',
  styleUrls: ['./analisis.component.css']
})
export class AnalisisComponent implements OnInit {
  constructor(private data: DataService) {}

  // 🔹 Filtros seleccionados
  filtroProceso = '';
  filtroEstado = '';
  filtroRemitente = '';
  fechaInicio = '';
  fechaFin = '';

  // Listados para selects dinámicos
  procesos: string[] = [];
  estados: string[] = [];
  remitentes: string[] = [];

  // Opciones de gráfico
  chartOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { color: '#003865' } } },
    scales: {
      x: { ticks: { color: '#003865' }, grid: { color: '#e0e0e0' } },
      y: { ticks: { color: '#003865' }, grid: { color: '#e0e0e0' } }
    }
  };

  // Datos de gráficos
  chartEstados!: ChartConfiguration<'doughnut'>['data'];
  chartOperadores!: ChartConfiguration<'bar'>['data'];
  chartMensual!: ChartConfiguration<'line'>['data'];
  chartCertificados!: ChartConfiguration<'bar'>['data'];
  chartFirmantes!: ChartConfiguration<'bar'>['data'];
  chartProcesos!: ChartConfiguration<'bar'>['data'];
  chartFirmasTipo!: ChartConfiguration<'pie'>['data'];
  chartHeatmap!: ChartConfiguration<'bar'>['data'];

  ngOnInit(): void {
    // Rellenar opciones
    this.procesos = [...new Set(this.data.sobres.map(s => s.nombre.split('_')[0]))];
    this.estados = [...new Set(this.data.sobres.map(s => s.estado))];
    this.remitentes = [...new Set(this.data.sobres.map(s => s.remitente))];

    this.loadCharts();
  }

  // 🟢 Aplica filtros y recarga las gráficas
  applyFilters() {
    this.loadCharts();
  }

  clearFilters() {
    this.filtroProceso = '';
    this.filtroEstado = '';
    this.filtroRemitente = '';
    this.fechaInicio = '';
    this.fechaFin = '';
    this.loadCharts();
  }

  private loadCharts() {
    let sobres = [...this.data.sobres];

    // Aplicar filtros
    if (this.filtroProceso) {
      sobres = sobres.filter(s => s.nombre.startsWith(this.filtroProceso));
    }
    if (this.filtroEstado) {
      sobres = sobres.filter(s => s.estado === this.filtroEstado);
    }
    if (this.filtroRemitente) {
      sobres = sobres.filter(s => s.remitente === this.filtroRemitente);
    }
    if (this.fechaInicio && this.fechaFin) {
      const start = new Date(this.fechaInicio);
      const end = new Date(this.fechaFin);
      sobres = sobres.filter(s => {
        const [dd, mm, yy] = s.fecha.split('/').map(Number);
        const d = new Date(2000 + yy, mm - 1, dd);
        return d >= start && d <= end;
      });
    }

    const certificados = [...this.data.certificados];
    const firmantes = [...this.data.firmantes];

    // 1️⃣ Estados
    const estados = ['En Proceso','Finalizado','Rechazado','Caducado','Cancelado'];
    const countEstados = estados.map(e => sobres.filter(s => s.estado === e).length);
    this.chartEstados = { labels: estados, datasets: [{ data: countEstados, backgroundColor: ['#00C1D4','#28A745','#DC3545','#FFC107','#003865'] }] };

    // 2️⃣ Operadores
    const operadores = [...new Set(sobres.map(s => s.remitente))];
    const countOperadores = operadores.map(o => sobres.filter(s => s.remitente === o).length);
    this.chartOperadores = { labels: operadores, datasets: [{ data: countOperadores, label: 'Sobres enviados', backgroundColor: '#00C1D4' }] };

    // 3️⃣ Mensual
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct'];
    const countMes = meses.map((_, i) => sobres.filter(s => parseInt(s.fecha.split('/')[1], 10) === i+1).length);
    this.chartMensual = { labels: meses, datasets: [{ data: countMes, label: 'Sobres enviados', borderColor: '#003865', backgroundColor: '#00C1D4' }] };

    // 4️⃣ Certificados (igual que antes)
    const activos = certificados.filter(c => new Date(this.formatDate(c.fechaVencimiento)) > new Date()).length;
    const vencidos = certificados.length - activos;
    this.chartCertificados = { labels: ['Activos','Vencidos'], datasets: [{ data: [activos, vencidos], backgroundColor: ['#28A745','#DC3545'] }] };

    // 5️⃣ Firmantes top 10
    const firmantesMap: Record<string, number> = {};
    firmantes.forEach(f => { firmantesMap[f.nombre] = (firmantesMap[f.nombre] || 0) + f.documentos; });
    const topFirmantes = Object.entries(firmantesMap).sort((a,b)=>b[1]-a[1]).slice(0,10);
    this.chartFirmantes = { labels: topFirmantes.map(f=>f[0]), datasets:[{ data: topFirmantes.map(f=>f[1]), label:'Documentos firmados', backgroundColor:'#FFB81C' }] };

    // 6️⃣ Procesos
    const procesos = this.procesos;
    const countProcesos = procesos.map(p => sobres.filter(s => s.nombre.startsWith(p)).length);
    this.chartProcesos = { labels: procesos, datasets:[{ data: countProcesos, label:'Sobres por proceso', backgroundColor:'#003865' }] };

    // 7️⃣ Tipos de firma
    const tiposFirma = ['OneShot','Clic al tocar','Biometrica','Larga Duracion'];
    const countFirmasTipo = tiposFirma.map(t => sobres.filter(s => s.firma === t).length);
    this.chartFirmasTipo = { labels: tiposFirma, datasets:[{ data: countFirmasTipo, backgroundColor:['#00C1D4','#FFB81C','#28A745','#DC3545'] }] };

    // 8️⃣ Heatmap simplificado
    const dias = ['Lun','Mar','Mié','Jue','Vie'];
    const countDias = dias.map((_, i) => sobres.filter(s => new Date(this.formatDate(s.fecha)).getDay() === i+1).length);
    this.chartHeatmap = { labels: dias, datasets:[{ data: countDias, label:'Sobres por día', backgroundColor:'#00C1D4' }] };
  }

  // Formato fecha
  private formatDate(d: string): string {
    const [dd, mm, yy] = d.split('/').map(Number);
    return `20${yy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
  }
}
