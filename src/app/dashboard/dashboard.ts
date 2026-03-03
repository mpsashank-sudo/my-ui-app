import { Component, OnInit } from '@angular/core';
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
  lastSavedDate: string = 'Never';
  
  projects: any[] = [];
  actions: any[] = [];
  newActionText: string = '';
  
  // Summary Stats
  edgeTickets: number = 0;
  codeFixes: number = 0;
  openIssues: number = 0;

  // Filter for Actions
  actionFilter: string = 'All';

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadData();
  }

  // Utility to format any date string to DD-MON-YYYY
  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${String(date.getDate()).padStart(2, '0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }

  loadData() {
    const currentData = localStorage.getItem(`edge_report_${this.presentationDate}`);
    
    if (currentData) {
      this.applyData(JSON.parse(currentData));
      this.lastSavedDate = this.formatDate(this.presentationDate);
    } else {
      // Look for the most recent previous entry
      const allKeys = Object.keys(localStorage)
        .filter(k => k.startsWith('edge_report_'))
        .sort().reverse();

      if (allKeys.length > 0) {
        const lastData = JSON.parse(localStorage.getItem(allKeys[0])!);
        this.applyData(lastData);
        this.lastSavedDate = "Inherited from " + this.formatDate(allKeys[0].replace('edge_report_', ''));
      } else {
        this.resetProjects();
        this.lastSavedDate = "New Template";
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

  resetProjects() {
    this.projects = [{ customer: '', rag: 'GREEN', status: 'Implementation', revTarget: 0, revAtRisk: 'No', milestone: '', planned: '', actual: '', upcoming: '', callouts: '' }];
    this.actions = [];
  }

  // Project Management
  addProject() { this.projects.push({ customer: '', rag: 'GREEN', status: 'Implementation', revTarget: 0, revAtRisk: 'No', milestone: '', planned: '', actual: '', upcoming: '', callouts: '' }); }
  removeProject(i: number) { this.projects.splice(i, 1); }

  // Action Management
  addAction() {
    if (this.newActionText) {
      this.actions.push({ text: this.newActionText, status: 'Open', comment: '', closureDate: '' });
      this.newActionText = '';
    }
  }
  removeAction(i: number) { this.actions.splice(i, 1); }

  get filteredActions() {
    if (this.actionFilter === 'All') return this.actions;
    return this.actions.filter(a => a.status === this.actionFilter);
  }

  // Summary Logic
  get liveCount() { return this.projects.filter(p => p.status === 'Live').length; }
  get supportCount() { return this.projects.filter(p => p.status === 'Support').length; }
  get ragStats() {
    return {
      red: this.projects.filter(p => p.rag === 'RED').length,
      amber: this.projects.filter(p => p.rag === 'AMBER').length,
      green: this.projects.filter(p => p.rag === 'GREEN').length
    };
  }

  // Save & CSV Export
  saveReport() {
    const payload = { projects: this.projects, actions: this.actions, edgeTickets: this.edgeTickets, codeFixes: this.codeFixes, openIssues: this.openIssues };
    localStorage.setItem(`edge_report_${this.presentationDate}`, JSON.stringify(payload));
    this.lastSavedDate = this.formatDate(this.presentationDate);
    this.exportToCSV(payload);
  }

  exportToCSV(data: any) {
    let csv = "Customer,RAG,Status,RevTarget,AtRisk,Milestone,Planned,Actual,Upcoming,Callouts\n";
    data.projects.forEach((p: any) => {
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