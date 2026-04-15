import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Team {
  id: number;
  name: string;
}

export interface BracketMatch {
  top: string;
  bottom: string;
  winner?: string;
}

@Component({
  selector: 'app-digitacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './digitacion.component.html',
  styleUrls: ['./digitacion.component.scss'],
})
export class DigitacionComponent {
  faseGruposExpanded = false;
  rondasExpanded = true;
  faseInicial: 'octavos' | 'cuartos' | 'semifinal' = 'octavos';
  tercerPuesto = true;
  desempate = true;

  teams: Team[] = Array.from({ length: 16 }, (_, i) => ({
    id: i + 1,
    name: `Equipo ${i + 1}`,
  }));

  navItems = [
    { label: 'Inicio', icon: 'home', active: false, hasSubmenu: false },
    { label: 'Competencias', icon: 'trophy', active: true, hasSubmenu: true, expanded: true,
      children: [
        { label: 'Lista de competencias', active: false },
        { label: 'Nueva competencia', active: true },
      ]
    },
    { label: 'Digitadores', icon: 'users', active: false, hasSubmenu: false },
    { label: 'Coordinadores', icon: 'user-check', active: false, hasSubmenu: false },
    { label: 'Auditoria', icon: 'book', active: false, hasSubmenu: false },
  ];

  steps = [
    { label: 'Prueba', completed: true, active: false },
    { label: 'Sistema', completed: true, active: false },
    { label: 'Configuración', completed: true, active: false },
    { label: 'Enfrentamiento', completed: false, active: true },
  ];

  setFaseInicial(fase: 'octavos' | 'cuartos' | 'semifinal') {
    this.faseInicial = fase;
  }
}
