import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
  returnUrl: string = '/dashboard'; // Default fallback
  private readonly allowedReturnUrls = new Set(['/dashboard', '/achievements', '/login']);

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Look at the URL to see if there's a specific page the user wanted
    // e.g., localhost:4200/login?returnUrl=%2Fachievements
    this.returnUrl = this.sanitizeReturnUrl(this.route.snapshot.queryParams['returnUrl']);
  }

  login() {
    // Performance Note: You can add your auth logic here
    // For now, we navigate to the intended destination
    this.router.navigateByUrl(this.returnUrl);
  }

  private sanitizeReturnUrl(raw: unknown): string {
    if (typeof raw !== 'string') return '/dashboard';
    if (!raw.startsWith('/')) return '/dashboard';
    if (raw.startsWith('//')) return '/dashboard';
    if (raw.includes('://')) return '/dashboard';
    if (raw.includes('\n') || raw.includes('\r')) return '/dashboard';
    const path = raw.split('?')[0].split('#')[0];
    return this.allowedReturnUrls.has(path) ? raw : '/dashboard';
  }
}
