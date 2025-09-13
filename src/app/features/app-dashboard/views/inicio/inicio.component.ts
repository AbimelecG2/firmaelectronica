import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit {
  totalSobres = 842;         // Ejemplo de datos mock
  totalCertificados = 356;
  totalFirmas = 1235;

  ngOnInit(): void {
    // Aquí luego conectás con Firebase o tus servicios
  }
}
