import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BetService } from '../../core/services/bet.service';

@Component({
  selector: 'app-create-bet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="create-bet">
      <h1>➕ Create a Bet</h1>
      <p class="subtitle">Define your bet, set the stakes, and wait for someone to challenge you.</p>

      @if (error()) {
        <div class="error-msg">{{ error() }}</div>
      }

      <form (ngSubmit)="onCreate()" class="bet-form">
        <div class="form-group">
          <label>Title</label>
          <input type="text" [(ngModel)]="title" name="title" placeholder="e.g. Will BTC reach $100k by EOY?" required />
        </div>

        <div class="form-group">
          <label>Description (optional)</label>
          <textarea [(ngModel)]="description" name="description" rows="3" placeholder="Additional context about the bet..."></textarea>
        </div>

        <div class="options-row">
          <div class="form-group">
            <label>Option A (your pick)</label>
            <input type="text" [(ngModel)]="optionA" name="optionA" placeholder="e.g. Yes, it will" required class="option-input-a" />
          </div>
          <div class="vs">VS</div>
          <div class="form-group">
            <label>Option B (challenger's pick)</label>
            <input type="text" [(ngModel)]="optionB" name="optionB" placeholder="e.g. No, it won't" required class="option-input-b" />
          </div>
        </div>

        <div class="stake-row">
          <div class="form-group">
            <label>Amount (each side stakes this)</label>
            <input type="number" [(ngModel)]="amount" name="amount" min="0.001" step="0.001" placeholder="0.1" required />
          </div>
          <div class="form-group">
            <label>Currency</label>
            <select [(ngModel)]="currency" name="currency">
              <option value="ETH">ETH</option>
              <option value="WBTC">WBTC</option>
              <option value="USDT">USDT</option>
              <option value="BNB">BNB</option>
            </select>
          </div>
          <div class="form-group">
            <label>Expires in (hours)</label>
            <input type="number" [(ngModel)]="expiresInHours" name="expiresInHours" min="1" max="720" />
          </div>
        </div>

        <div class="summary">
          <p>💰 Total pool: <strong>{{ amount * 2 }} {{ currency }}</strong></p>
          <p>🏠 House fee (10%): <strong>{{ amount * 2 * 0.1 }} {{ currency }}</strong></p>
          <p>🏆 Winner takes: <strong>{{ amount * 2 * 0.9 }} {{ currency }}</strong></p>
        </div>

        <button type="submit" [disabled]="loading()" class="btn-create">
          {{ loading() ? 'Creating...' : 'Create Bet' }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .create-bet h1 { color: #fff; margin: 0 0 0.25rem; }
    .subtitle { color: #888; margin: 0 0 1.5rem; }
    .bet-form { max-width: 700px; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; color: #aaa; margin-bottom: 0.25rem; font-size: 0.85rem; }
    .form-group input, .form-group textarea, .form-group select {
      width: 100%;
      padding: 0.7rem;
      border: 1px solid #333;
      border-radius: 8px;
      background: #16213e;
      color: #fff;
      font-size: 0.95rem;
      box-sizing: border-box;
    }
    .form-group input:focus, .form-group textarea:focus { border-color: #00d4ff; outline: none; }
    .option-input-a:focus { border-color: #00c853 !important; }
    .option-input-b:focus { border-color: #ff4444 !important; }
    .options-row { display: flex; gap: 1rem; align-items: end; margin-bottom: 1rem; }
    .options-row .form-group { flex: 1; }
    .vs { color: #555; font-weight: 700; padding-bottom: 0.7rem; }
    .stake-row { display: flex; gap: 1rem; }
    .stake-row .form-group { flex: 1; }
    .summary {
      background: #1a1a2e;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 1rem;
      margin: 1.5rem 0;
    }
    .summary p { color: #aaa; margin: 0.25rem 0; font-size: 0.9rem; }
    .summary strong { color: #fff; }
    .btn-create {
      width: 100%;
      padding: 0.85rem;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #00d4ff, #0090ff);
      color: #fff;
      font-size: 1.05rem;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-create:hover { opacity: 0.9; }
    .btn-create:disabled { opacity: 0.5; cursor: not-allowed; }
    .error-msg { background: #ff4444; color: #fff; padding: 0.5rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem; }
  `]
})
export class CreateBetComponent {
  title = '';
  description = '';
  optionA = '';
  optionB = '';
  amount = 0.1;
  currency = 'ETH';
  expiresInHours = 24;
  loading = signal(false);
  error = signal('');

  constructor(private betService: BetService, private router: Router) {}

  async onCreate() {
    this.error.set('');
    this.loading.set(true);
    try {
      const bet = await this.betService.createBet({
        title: this.title,
        description: this.description,
        optionA: this.optionA,
        optionB: this.optionB,
        amount: this.amount,
        currency: this.currency,
        expiresInHours: this.expiresInHours
      });
      this.router.navigate(['/bets', bet.id]);
    } catch (e: any) {
      this.error.set(e.message || 'Failed to create bet');
    } finally {
      this.loading.set(false);
    }
  }
}
