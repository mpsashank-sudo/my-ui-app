import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core'; // Added Inject and PLATFORM_ID
import { isPlatformBrowser } from '@angular/common'; // Added this
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  presentationDate: string = new Date().toISOString().split('T')[0];
  lastSavedLabel: string = 'No previous data found';
  
  projects: any[] = [];
  actions: any[] = [];
  newActionText: string = '';
  
  edgeTickets: number = 0;
  codeFixes: number = 0;
  openIssues: number = 0;
  actionFilter: string = 'All';

constructor(
  private router: Router,
  @Inject(PLATFORM_ID) private platformId: Object // Add this line
) {}

  ngOnInit() {
    this.loadData();
  }

  // Format Date to DD-MON-YYYY
  displayDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${String(date.getDate()).padStart(2, '0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }

  loadData() {
  // Only run this if we are in the browser
  if (isPlatformBrowser(this.platformId)) {
    const currentData = localStorage.getItem(`edge_report_${this.presentationDate}`);
    
    if (currentData) {
      this.applyData(JSON.parse(currentData));
      this.lastSavedLabel = `Viewing saved data for ${this.displayDate(this.presentationDate)}`;
    } else {
      const allKeys = Object.keys(localStorage)
        .filter(k => k.startsWith('edge_report_'))
        .sort().reverse();

      if (allKeys.length > 0) {
        this.applyData(JSON.parse(localStorage.getItem(allKeys[0])!));
        this.lastSavedLabel = `Inherited from ${this.displayDate(allKeys[0].replace('edge_report_', ''))}`;
      } else {
        this.resetDashboard();
        this.lastSavedLabel = "New Template Initialized";
      }
    }
  }
}

  applyData(data: any) {
    this.projects = data.projects || [];
    this.actions = data.actions || [];
    this.edgeTickets = data.edgeTickets || 0;
    this.codeFixes = data.codeFixes || 0;
    this.openIssues = data.openIssues || 0;
  }

  resetDashboard() {
    this.projects = [{ customer: '', rag: 'GREEN', status: 'Implementation', revTarget: 0, revAtRisk: 'No', milestone: '', planned: '', actual: '', upcoming: '', callouts: '' }];
    this.actions = [];
  }

  // Project/Action Management
  addProject() { this.projects.push({ customer: '', rag: 'GREEN', status: 'Implementation', revTarget: 0, revAtRisk: 'No', milestone: '', planned: '', actual: '', upcoming: '', callouts: '' }); }
  removeProject(i: number) { this.projects.splice(i, 1); }
  addAction() { if (this.newActionText) { this.actions.push({ text: this.newActionText, status: 'Open', comment: '', closureDate: '' }); this.newActionText = ''; } }
  removeAction(i: number) { this.actions.splice(i, 1); }

  // Computed Totals for Summary
  get totals() {
    return {
      live: this.projects.filter(p => p.status === 'Live').length,
      support: this.projects.filter(p => p.status === 'Support').length,
      red: this.projects.filter(p => p.rag === 'RED').length,
      amber: this.projects.filter(p => p.rag === 'AMBER').length,
      green: this.projects.filter(p => p.rag === 'GREEN').length,
      revenueTarget: this.projects.reduce((sum, p) => sum + (Number(p.revTarget) || 0), 0),
      revenueAtRisk: this.projects.filter(p => p.revAtRisk === 'Yes').reduce((sum, p) => sum + (Number(p.revTarget) || 0), 0)
    };
  }

  get filteredActions() {
    return this.actionFilter === 'All' ? this.actions : this.actions.filter(a => a.status === this.actionFilter);
  }

saveReport() {
  const payload = { projects: this.projects, actions: this.actions, edgeTickets: this.edgeTickets, codeFixes: this.codeFixes, openIssues: this.openIssues };
  
  // Guard the save logic
  if (isPlatformBrowser(this.platformId)) {
    localStorage.setItem(`edge_report_${this.presentationDate}`, JSON.stringify(payload));
    this.lastSavedLabel = `Last Saved: ${this.displayDate(this.presentationDate)}`;
    this.exportToCSV();
  }
}

  exportToCSV() {
    let csv = "Customer,RAG,Status,RevTarget,AtRisk,Milestone,Planned,Actual,Upcoming,Callouts\n";
    this.projects.forEach(p => {
      csv += `${p.customer},${p.rag},${p.status},${p.revTarget},${p.revAtRisk},${p.milestone},${p.planned},${p.actual},${p.upcoming},"${p.callouts.replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EDGE_Review_${this.presentationDate}.csv`;
    a.click();
  }

  logout() { this.router.navigate(['/login']); }
}