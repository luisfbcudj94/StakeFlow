import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BetService } from '../../core/services/bet.service';
import { BetDto } from '../../core/models/api.models';

@Component({
  selector: 'app-explore-bets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="explore">
      <div class="page-header">
        <h1>🔍 Explore Bets</h1>
        <div class="filters">
          <select [(ngModel)]="currencyFilter" (ngModelChange)="loadBets()" class="select">
            <option value="">All Currencies</option>
            <option value="ETH">ETH</option>
            <option value="WBTC">WBTC</option>
            <option value="USDT">USDT</option>
            <option value="BNB">BNB</option>
          </select>
        </div>
      </div>

      @if (bets().length === 0) {
        <div class="empty-state">
          <p>No open bets available.</p>
          <a routerLink="/bets/create" class="btn-primary">Create the first bet!</a>
        </div>
      }

      <div class="bets-grid">
        @for (bet of bets(); track bet.id) {
          <a [routerLink]="['/bets', bet.id]" class="bet-card">
            <div class="bet-card-header">
              <span class="currency-badge">{{ bet.currency }}</span>
              <span class="amount">{{ bet.amount }} {{ bet.currency }}</span>
            </div>
            <h3>{{ bet.title }}</h3>
            @if (bet.description) {
              <p class="desc">{{ bet.description }}</p>
            }
            <div class="options">
              <div class="option option-a">
                <span class="option-label">A</span>
                {{ bet.optionA }}
              </div>
              <span class="vs">VS</span>
              <div class="option option-b">
                <span class="option-label">B</span>
                {{ bet.optionB }}
              </div>
            </div>
            <div class="bet-card-footer">
              <span class="creator">by {{ bet.participants[0]?.displayName }}</span>
              <span class="expires">Expires: {{ bet.expiresAt | date:'short' }}</span>
            </div>
          </a>
        }
      </div>
    </div>
  `,
  styles: [`
    .explore h1 { color: #fff; margin: 0; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .select {
      padding: 0.5rem 1rem;
      border: 1px solid #333;
      border-radius: 8px;
      background: #1a1a2e;
      color: #fff;
    }
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
    .bets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1rem; }
    .bet-card {
      background: #1a1a2e;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 1.25rem;
      text-decoration: none;
      transition: border-color 0.2s, transform 0.2s;
    }
    .bet-card:hover { border-color: #00d4ff; transform: translateY(-2px); }
    .bet-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .currency-badge { background: rgba(0,212,255,0.15); color: #00d4ff; padding: 0.15rem 0.5rem; border-radius: 8px; font-weight: 700; font-size: 0.75rem; }
    .amount { color: #fff; font-weight: 700; font-size: 1.1rem; }
    .bet-card h3 { color: #fff; margin: 0 0 0.5rem; font-size: 1rem; }
    .desc { color: #888; font-size: 0.85rem; margin: 0 0 0.75rem; }
    .options { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
    .option {
      flex: 1;
      padding: 0.5rem;
      border-radius: 8px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .option-a { background: rgba(0,200,83,0.1); color: #00c853; border: 1px solid rgba(0,200,83,0.2); }
    .option-b { background: rgba(255,68,68,0.1); color: #ff4444; border: 1px solid rgba(255,68,68,0.2); }
    .option-label { font-weight: 700; font-size: 0.7rem; padding: 0.1rem 0.3rem; border-radius: 4px; background: rgba(255,255,255,0.1); }
    .vs { color: #555; font-size: 0.75rem; font-weight: 700; }
    .bet-card-footer { display: flex; justify-content: space-between; color: #666; font-size: 0.75rem; }
  `]
})
export class ExploreBetsComponent implements OnInit {
  bets = signal<BetDto[]>([]);
  currencyFilter = '';

  constructor(private betService: BetService) {}

  async ngOnInit() {
    await this.loadBets();
  }

  async loadBets() {
    try {
      const bets = await this.betService.getOpenBets(this.currencyFilter || undefined);
      this.bets.set(bets);
    } catch (e) {
      console.error('Load bets error:', e);
    }
  }
}
