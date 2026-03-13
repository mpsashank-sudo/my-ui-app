import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface AchievementItem {
  whatsDone: string;
  outcome: string;
  quantification: string;
  customers: string;
  whatsNext: string;
}

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './achievements.html',
  styleUrl: './achievements.css'
})
export class AchievementsComponent implements OnInit {
  categories = ['Engineering', 'DevOps', 'Delivery'];
  activeTab: string = 'Engineering'; // Default tab
  
  achievementsData: Record<string, AchievementItem[]> = {
    'Engineering': [],
    'DevOps': [],
    'Delivery': []
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    const saved = localStorage.getItem('edge_achievements');
    if (saved) {
      try {
        this.achievementsData = JSON.parse(saved);
      } catch {
        this.achievementsData = {
          'Engineering': [],
          'DevOps': [],
          'Delivery': []
        };
      }
    }
  }

  // Helper to get count for badges
  getCount(category: string): number {
    return this.achievementsData[category]?.length || 0;
  }

  setActiveTab(category: string) {
    this.activeTab = category;
  }

  addItem() {
    this.achievementsData[this.activeTab].push({
      whatsDone: '', outcome: '', quantification: '', customers: '', whatsNext: ''
    });
  }

  removeItem(index: number) {
    if (!isPlatformBrowser(this.platformId)) return;
    if (confirm('Remove this achievement?')) {
      this.achievementsData[this.activeTab].splice(index, 1);
      this.saveAchievements(false);
    }
  }

  saveAchievements(showAlert = true) {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem('edge_achievements', JSON.stringify(this.achievementsData));
    if (showAlert) alert('EDGE Achievements saved successfully!');
  }

  exportToCSV() {
    if (!isPlatformBrowser(this.platformId)) return;
    let csvContent = "Category,What's Done,Outcome,Quantification,Customers,What's Next\n";
    this.categories.forEach(cat => {
      this.achievementsData[cat].forEach(item => {
        const row = [cat, `"${item.whatsDone}"`, `"${item.outcome}"`, `"${item.quantification}"`, `"${item.customers}"`, `"${item.whatsNext}"`].join(",");
        csvContent += row + "\n";
      });
    });
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `EDGE_Achievements_Export.csv`;
    link.click();
  }
}
