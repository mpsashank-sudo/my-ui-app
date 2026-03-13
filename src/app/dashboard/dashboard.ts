import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core'; // Added Inject and PLATFORM_ID
import { isPlatformBrowser } from '@angular/common'; // Added this
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleGenerativeAI } from "@google/generative-ai";

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
  private readonly CHAT_STORAGE_KEY = 'edge_assist_history';
  private readonly MAX_CHAT_CONTEXT = 10;
  private readonly MAX_CHAT_HISTORY = 100;
  private readonly MAX_REPORTS_FOR_CHAT = 30;
  
  projects: any[] = [];
  actions: any[] = [];
  newActionText: string = '';
  newActionOwner: string = '';
  
  edgeTickets: number = 0;
  codeFixes: number = 0;
  openIssues: number = 0;
  actionFilter: string = 'All';
  isChatOpen: boolean = false;
chatInput: string = '';
chatHistory: { role: 'user' | 'bot', text: string, timestamp?: string }[] = [];
isLoading: boolean = false;

constructor(
  private router: Router,
  @Inject(PLATFORM_ID) private platformId: Object // Add this line
) {}

  ngOnInit() {
    this.loadData();
    this.loadChatHistory();
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private safeJsonParse<T>(raw: string | null, fallback: T): T {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private getAiApiKey(): string | null {
    if (!this.isBrowser()) return null;
    const key = (window as any).EDGE_AI_API_KEY;
    if (typeof key !== 'string') return null;
    const trimmed = key.trim();
    return trimmed.length > 0 ? trimmed : null;
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
  if (this.isBrowser()) {
    const currentData = localStorage.getItem(`edge_report_${this.presentationDate}`);
    
    if (currentData) {
      this.applyData(this.safeJsonParse(currentData, {}));
      this.lastSavedLabel = `Viewing saved data for ${this.displayDate(this.presentationDate)}`;
    } else {
      const allKeys = Object.keys(localStorage)
        .filter(k => k.startsWith('edge_report_'))
        .sort().reverse();

      if (allKeys.length > 0) {
        this.applyData(this.safeJsonParse(localStorage.getItem(allKeys[0]), {}));
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
addAction() {
  if (this.newActionText.trim()) {
    this.actions.push({
      text: this.newActionText,
      status: 'Open',
      comment: '',
      owner: this.newActionOwner || 'Unassigned', // Uses the small input or default
      raisedDate: new Date().toISOString().split('T')[0], // Sets to today's date
      closureDate: ''
    });
    
    // Reset inputs
    this.newActionText = '';
    this.newActionOwner = '';
    this.saveReport(); // Ensure this triggers your localStorage save
  }
}  removeAction(i: number) { this.actions.splice(i, 1); }

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
  if (this.isBrowser()) {
    localStorage.setItem(`edge_report_${this.presentationDate}`, JSON.stringify(payload));
    this.lastSavedLabel = `Last Saved: ${this.displayDate(this.presentationDate)}`;
    this.exportToCSV();
  }
}

  exportToCSV() {
    if (!this.isBrowser()) return;
    let csv = "Customer,RAG,Status,RevTarget,AtRisk,Milestone,Planned,Actual,Upcoming,Callouts\n";
    this.projects.forEach(p => {
      const callouts = String(p.callouts ?? '').replace(/"/g, '""');
      csv += `${p.customer},${p.rag},${p.status},${p.revTarget},${p.revAtRisk},${p.milestone},${p.planned},${p.actual},${p.upcoming},"${callouts}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EDGE_Review_${this.presentationDate}.csv`;
    a.click();
  }

  // 3. Add the Chat Functionality
async sendMessage() {
  if (!this.isBrowser()) return;
  if (!this.chatInput.trim()) return;

  // 1. Capture User Input with Timestamp
  const userText = this.chatInput;
const userMessage = { 
  role: 'user' as const, // The 'as const' tells TS this isn't just any string
  text: userText, 
  timestamp: new Date().toISOString() 
};
  
  this.chatHistory.push(userMessage);
  this.trimChatHistory();
  this.chatInput = '';
  this.isLoading = true;
  this.saveChatToLocal(); // Helper to persist chat immediately

  try {
    // --- STEP A: GATHER DASHBOARD DATA (Hard Facts) ---
    const allReports = this.buildReportsContext(this.MAX_REPORTS_FOR_CHAT);

    // --- STEP B: GATHER CONVERSATION CONTEXT (The Flow) ---
    const recentChatContext = this.buildChatContext(this.MAX_CHAT_CONTEXT);

    // --- STEP C: INITIALIZE AI ---
    const apiKey = this.getAiApiKey();
    if (!apiKey) {
      this.chatHistory.push({ role: 'bot', text: 'AI chat is not configured. Please set EDGE_AI_API_KEY in the browser.' });
      this.saveChatToLocal();
      return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // --- STEP D: CREATE THE ENHANCED PROMPT ---
    const systemPrompt = `
      You are the "EDGE AI Assist". 
      
      DASHBOARD DATA (Project History):
      ${allReports || "No reports saved."}

      RECENT CONVERSATION (Memory):
      ${recentChatContext}

      INSTRUCTIONS:
      1. Use the Dashboard Data for technical/status facts.
      2. Use the Recent Conversation to understand follow-up questions.
      3. Be concise, professional, and delivery-focused.
    `;

    // --- STEP E: GENERATE RESPONSE ---
    const result = await model.generateContent(`${systemPrompt}\n\nUSER QUESTION: ${userText}`);
    const response = await result.response;
    const botText = response.text();
    
    // 2. Capture Bot Response with Timestamp
const botMessage = { 
  role: 'bot' as const, // Explicitly lock this to the "bot" type
  text: botText, 
  timestamp: new Date().toISOString() 
};
    
    this.chatHistory.push(botMessage);
    this.trimChatHistory();
    this.saveChatToLocal(); // Save again after bot responds

  } catch (error: any) {
    console.error("Chat Error:", error);
    this.chatHistory.push({ role: 'bot', text: "Sorry, I hit a snag: " + error.message });
  } finally {
    this.isLoading = false;
  }
}

// Ensure you have this helper method in your class
saveChatToLocal() {
  if (this.isBrowser()) {
    this.trimChatHistory();
    localStorage.setItem(this.CHAT_STORAGE_KEY, JSON.stringify(this.chatHistory));
  }
}

loadChatHistory() {
  if (this.isBrowser()) {
    const data = localStorage.getItem(this.CHAT_STORAGE_KEY);
    if (data) {
      this.chatHistory = this.safeJsonParse(data, []);
      this.trimChatHistory();
    }
  }
}

toggleChat() { this.isChatOpen = !this.isChatOpen; }

  logout() { this.router.navigate(['/login']); }

  private trimChatHistory() {
    if (this.chatHistory.length > this.MAX_CHAT_HISTORY) {
      this.chatHistory = this.chatHistory.slice(-this.MAX_CHAT_HISTORY);
    }
  }

  private buildChatContext(maxMessages: number): string {
    return this.chatHistory
      .slice(-maxMessages)
      .map(m => `${m.role.toUpperCase()}: ${m.text}`)
      .join('\n');
  }

  private buildReportsContext(maxReports: number): string {
    if (!this.isBrowser()) return '';
    const keys = Object.keys(localStorage)
      .filter(k => k.startsWith('edge_report_'))
      .sort()
      .reverse()
      .slice(0, maxReports);

    return keys
      .map(k => {
        const date = k.replace('edge_report_', '');
        const data = this.safeJsonParse(localStorage.getItem(k), {});
        const projectSummary = (data as any).projects?.map((p: any) => 
          `- Customer: ${p.customer}, RAG: ${p.rag}, Status: ${p.status}, Target: ${p.revTarget}`
        ).join('\n');

        const actionSummary = (data as any).actions?.map((a: any) => 
          `- Action: ${a.text}, Owner: ${a.owner}, Status: ${a.status}`
        ).join('\n');

        const kpis = `* Code Fixes: ${(data as any).codeFixes || 0}, * Tickets: ${(data as any).edgeTickets || 0}, * Issues: ${(data as any).openIssues || 0}`;

        return `REPORT DATE: ${date}\nKPIs: ${kpis}\nPROJECTS:\n${projectSummary}\nACTIONS:\n${actionSummary}`;
      })
      .join("\n\n---\n\n");
  }
}
