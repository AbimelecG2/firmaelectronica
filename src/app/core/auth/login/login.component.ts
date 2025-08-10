import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private router: Router) {}

  onLogin() {
    const validUsername = 'admin';
    const validPassword = '12346';

    if (this.username === validUsername && this.password === validPassword) {
      debugger
      this.router.navigate(['/inicio']);
    } else {
      this.errorMessage = 'Usuario o contraseña incorrectos';
    }
  }

  
}