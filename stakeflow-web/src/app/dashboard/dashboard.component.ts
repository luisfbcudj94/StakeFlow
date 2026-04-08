import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { WalletService } from '../core/services/wallet.service';
import { BetService } from '../core/services/bet.service';
import { WalletDto, BetDto } from '../core/models/api.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <h1>Welcome back, {{ authService.currentUser()?.displayName }}!</h1>

      <div class="stats-grid">
        @for (w of wallets(); track w.id) {
          <div class="stat-card">
            <div class="stat-currency">{{ w.currency }}</div>
            <div class="stat-balance">{{ w.balance | number:'1.4-4' }}</div>
            <div class="stat-label">
              Available: {{ w.availableBalance | number:'1.4-4' }}
              @if (w.frozenBalance > 0) {
                <span class="frozen">🔒 {{ w.frozenBalance | number:'1.4-4' }}</span>
              }
            </div>
          </div>
        }
      </div>

      <div class="sections-grid">
        <div class="section">
          <div class="section-header">
            <h2>My Active Bets</h2>
            <a routerLink="/bets/my" class="link">View all →</a>
          </div>
          @if (activeBets().length === 0) {
            <p class="empty">No active bets. <a routerLink="/bets/explore">Explore bets</a> or <a routerLink="/bets/create">create one</a>!</p>
          }
          @for (bet of activeBets(); track bet.id) {
            <a [routerLink]="['/bets', bet.id]" class="bet-row">
              <div class="bet-row-info">
                <span class="bet-title">{{ bet.title }}</span>
                <span class="bet-meta">{{ bet.amount }} {{ bet.currency }} · {{ bet.status }}</span>
              </div>
              <span class="badge" [class]="'badge-' + bet.status.toLowerCase()">{{ bet.status }}</span>
            </a>
          }
        </div>

        <div class="section">
          <div class="section-header">
            <h2>Recent Open Bets</h2>
            <a routerLink="/bets/explore" class="link">Explore →</a>
          </div>
          @if (recentBets().length === 0) {
            <p class="empty">No open bets available.</p>
          }
          @for (bet of recentBets(); track bet.id) {
            <a [routerLink]="['/bets', bet.id]" class="bet-row">
              <div class="bet-row-info">
                <span class="bet-title">{{ bet.title }}</span>
                <span class="bet-meta">{{ bet.amount }} {{ bet.currency }}</span>
              </div>
              <span class="badge badge-open">Open</span>
            </a>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard h1 { color: #fff; margin: 0 0 1.5rem; font-size: 1.6rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat-card {
      background: #1a1a2e;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 1.25rem;
    }
    .stat-currency { color: #00d4ff; font-weight: 700; font-size: 0.85rem; letter-spacing: 1px; }
    .stat-balance { color: #fff; font-size: 1.5rem; font-weight: 700; margin: 0.25rem 0; }
    .stat-label { color: #888; font-size: 0.8rem; }
    .frozen { color: #ffaa00; margin-left: 0.5rem; }
    .sections-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    @media (max-width: 900px) { .sections-grid { grid-template-columns: 1fr; } }
    .section {
      background: #1a1a2e;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 1.25rem;
    }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .section-header h2 { color: #fff; margin: 0; font-size: 1.1rem; }
    .link { color: #00d4ff; text-decoration: none; font-size: 0.85rem; }
    .link:hover { text-decoration: underline; }
    .empty { color: #666; font-size: 0.9rem; }
    .empty a { color: #00d4ff; text-decoration: none; }
    .bet-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      border: 1px solid #2a2a4a;
      border-radius: 8px;
      margin-bottom: 0.5rem;
      text-decoration: none;
      transition: background 0.2s;
    }
    .bet-row:hover { background: rgba(255,255,255,0.03); }
    .bet-row-info { display: flex; flex-direction: column; }
    .bet-title { color: #fff; font-size: 0.9rem; font-weight: 500; }
    .bet-meta { color: #888; font-size: 0.75rem; margin-top: 0.15rem; }
    .badge {
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-open { background: rgba(0,212,255,0.15); color: #00d4ff; }
    .badge-matched { background: rgba(255,170,0,0.15); color: #ffaa00; }
    .badge-pendingresolution { background: rgba(255,136,0,0.15); color: #ff8800; }
    .badge-resolved { background: rgba(0,200,83,0.15); color: #00c853; }
    .badge-disputed { background: rgba(255,68,68,0.15); color: #ff4444; }
    .badge-cancelled { background: rgba(136,136,136,0.15); color: #888; }
  `]
})
export class DashboardComponent implements OnInit {
  wallets = signal<WalletDto[]>([]);
  activeBets = signal<BetDto[]>([]);
  recentBets = signal<BetDto[]>([]);

  constructor(
    public authService: AuthService,
    private walletService: WalletService,
    private betService: BetService
  ) {}

  async ngOnInit() {
    try {
      const [wallets, myBets, openBets] = await Promise.all([
        this.walletService.getWallets(),
        this.betService.getMyBets(),
        this.betService.getOpenBets()
      ]);
      this.wallets.set(wallets);
      this.activeBets.set(myBets.filter(b => ['Open', 'Matched', 'PendingResolution'].includes(b.status)).slice(0, 5));
      this.recentBets.set(openBets.slice(0, 5));
    } catch (e) {
      console.error('Dashboard load error:', e);
    }
  }
}
