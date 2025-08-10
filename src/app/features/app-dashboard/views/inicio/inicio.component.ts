import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit {
  totalFirmas: number = 1235; // Valor inicial

  ngOnInit(): void {
    // Lógica inicial (sin Firebase por ahora)
  }
}