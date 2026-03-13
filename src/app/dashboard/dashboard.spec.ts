import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { DashboardComponent } from './dashboard';

describe('Dashboard', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exportToCSV should handle missing callouts safely', () => {
    component.projects = [
      { customer: 'Acme', rag: 'GREEN', status: 'Live', revTarget: 10, revAtRisk: 'No', milestone: '', planned: '', actual: '', upcoming: '' }
    ];

    const originalCreateObjectURL = window.URL.createObjectURL;
    const originalCreateElement = document.createElement;
    let createObjectUrlCalled = false;
    let clickCalled = false;

    window.URL.createObjectURL = () => {
      createObjectUrlCalled = true;
      return 'blob:fake';
    };
    document.createElement = () =>
      ({ href: '', download: '', click: () => { clickCalled = true; } } as any);

    try {
      component.exportToCSV();
    } finally {
      window.URL.createObjectURL = originalCreateObjectURL;
      document.createElement = originalCreateElement;
    }

    expect(createObjectUrlCalled).toBe(true);
    expect(clickCalled).toBe(true);
  });

  it('buildReportsContext limits report count', () => {
    localStorage.clear();
    localStorage.setItem('edge_report_2026-03-10', JSON.stringify({ codeFixes: 1 }));
    localStorage.setItem('edge_report_2026-03-11', JSON.stringify({ codeFixes: 2 }));
    localStorage.setItem('edge_report_2026-03-12', JSON.stringify({ codeFixes: 3 }));

    const context = (component as any).buildReportsContext(2);
    expect(context).toContain('REPORT DATE: 2026-03-12');
    expect(context).toContain('REPORT DATE: 2026-03-11');
    expect(context).not.toContain('REPORT DATE: 2026-03-10');
  });

  it('saveChatToLocal trims history to max size', () => {
    const max = (component as any).MAX_CHAT_HISTORY as number;
    component.chatHistory = Array.from({ length: max + 5 }, (_, i) => ({
      role: 'user' as const,
      text: `m${i}`
    }));

    component.saveChatToLocal();
    const stored = JSON.parse(localStorage.getItem('edge_assist_history') || '[]');
    expect(stored.length).toBe(max);
  });
});
