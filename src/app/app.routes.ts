import { Routes } from '@angular/router';

// Make sure these paths match where your .ts files are located
import { LoginComponent } from './login/login'; 
import { DashboardComponent } from './dashboard/dashboard';

export const routes: Routes = [
  // 1. If the URL is empty (http://localhost:4200), go to login
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  // 2. The Login Page
  { path: 'login', component: LoginComponent },
  
  // 3. The Dashboard Page
  { path: 'dashboard', component: DashboardComponent },
  
  // 4. Wildcard: if the user types a random URL, send them to login
  { path: '**', redirectTo: 'login' }
];