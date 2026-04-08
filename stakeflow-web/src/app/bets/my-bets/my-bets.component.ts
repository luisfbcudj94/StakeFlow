import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BetService } from '../../core/services/bet.service';
import { BetDto } from '../../core/models/api.models';

@Component({
  selector: 'app-my-bets',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="my-bets">
      <h1>🎯 My Bets</h1>

      <div class="tabs">
        <button [class.active]="activeTab() === 'active'" (click)="activeTab.set('active')">Active</button>
        <button [class.active]="activeTab() === 'resolved'" (click)="activeTab.set('resolved')">Resolved</button>
        <button [class.active]="activeTab() === 'all'" (click)="activeTab.set('all')">All</button>
      </div>

      @if (filteredBets().length === 0) {
        <div class="empty-state">
          <p>No bets in this category.</p>
          <a routerLink="/bets/create" class="btn-primary">Create a bet</a>
        </div>
      }

      <div class="bets-list">
        @for (bet of filteredBets(); track bet.id) {
          <a [routerLink]="['/bets', bet.id]" class="bet-row">
            <div class="bet-row-left">
              <span class="badge" [class]="'badge-' + bet.status.toLowerCase()">{{ bet.status }}</span>
              <div class="bet-info">
                <span class="bet-title">{{ bet.title }}</span>
                <span class="bet-meta">
                  {{ bet.amount }} {{ bet.currency }} ·
                  {{ bet.participants.length }} participant(s) ·
                  {{ bet.createdAt | date:'shortDate' }}
                </span>
              </div>
            </div>
            <div class="bet-row-right">
              @if (bet.winningSide) {
                <span class="winner-info">Winner: Option {{ bet.winningSide }}</span>
              }
              <span class="arrow">→</span>
            </div>
          </a>
        }
      </div>
    </div>
  `,
  styles: [`
    .my-bets h1 { color: #fff; margin: 0 0 1.5rem; }
    .tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
    .tabs button {
      padding: 0.5rem 1.25rem;
      border: 1px solid #333;
      border-radius: 8px;
      background: #1a1a2e;
      color: #aaa;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .tabs button.active { background: rgba(0,212,255,0.15); color: #00d4ff; border-color: #00d4ff; }
    .empty-state { text-align: center; padding: 3rem; color: #888; }
    .btn-primary {
      display: inline-block;
      padding: 0.6rem 1.5rem;
      border-radius: 8px;
      background: linear-gradient(135deg, #00d4ff, #0090ff);
      color: #fff;
      text-decoration: none;
      font-weight: 600;
      margin-top: 1rem;
    }
    .bets-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .bet-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #1a1a2e;
      border: 1px solid #333;
      border-radius: 12px;
      text-decoration: none;
      transition: border-color 0.2s;
    }
    .bet-row:hover { border-color: #00d4ff; }
    .bet-row-left { display: flex; align-items: center; gap: 0.75rem; }
    .badge { padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; white-space: nowrap; }
    .badge-open { background: rgba(0,212,255,0.15); color: #00d4ff; }
    .badge-matched { background: rgba(255,170,0,0.15); color: #ffaa00; }
    .badge-pendingresolution { background: rgba(255,136,0,0.15); color: #ff8800; }
    .badge-resolved { background: rgba(0,200,83,0.15); color: #00c853; }
    .badge-disputed { background: rgba(255,68,68,0.15); color: #ff4444; }
    .badge-cancelled { background: rgba(136,136,136,0.15); color: #888; }
    .bet-info { display: flex; flex-direction: column; }
    .bet-title { color: #fff; font-weight: 500; }
    .bet-meta { color: #888; font-size: 0.8rem; margin-top: 0.15rem; }
    .bet-row-right { display: flex; align-items: center; gap: 0.75rem; }
    .winner-info { color: #00c853; font-size: 0.85rem; }
    .arrow { color: #555; font-size: 1.2rem; }
  `]
})
export class MyBetsComponent implements OnInit {
  allBets = signal<BetDto[]>([]);
  activeTab = signal<'active' | 'resolved' | 'all'>('active');

  constructor(private betService: BetService) {}

  filteredBets(): BetDto[] {
    const tab = this.activeTab();
    const bets = this.allBets();
    if (tab === 'active') return bets.filter(b => ['Open', 'Matched', 'PendingResolution'].includes(b.status));
    if (tab === 'resolved') return bets.filter(b => ['Resolved', 'Disputed', 'Cancelled'].includes(b.status));
    return bets;
  }

  async ngOnInit() {
    try {
      const bets = await this.betService.getMyBets();
      this.allBets.set(bets);
    } catch (e) {
      console.error('Load my bets error:', e);
    }
  }
}
