import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html', // <--- Matches your filename
  styleUrl: './login.css'       // <--- Matches your filename
})
export class LoginComponent {
  constructor(private router: Router) {}

  login() {
    this.router.navigate(['/dashboard']);
  }
}