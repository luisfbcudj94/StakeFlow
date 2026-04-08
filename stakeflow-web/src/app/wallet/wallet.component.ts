import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../core/services/wallet.service';
import { WalletDto, TransactionDto } from '../core/models/api.models';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wallet-page">
      <h1>💰 Wallet</h1>

      @if (error()) {
        <div class="error-msg">{{ error() }}</div>
      }
      @if (successMsg()) {
        <div class="success-msg">{{ successMsg() }}</div>
      }

      <div class="wallets-grid">
        @for (w of wallets(); track w.id) {
          <div class="wallet-card">
            <div class="wallet-header">
              <span class="currency-badge">{{ w.currency }}</span>
              <span class="network">{{ w.network }}</span>
            </div>
            <div class="balance">{{ w.balance | number:'1.4-4' }}</div>
            <div class="balance-detail">
              Available: {{ w.availableBalance | number:'1.4-4' }}
              @if (w.frozenBalance > 0) {
                · <span class="frozen">🔒 {{ w.frozenBalance | number:'1.4-4' }}</span>
              }
            </div>
            <div class="address">
              <small>{{ w.depositAddress }}</small>
            </div>
          </div>
        }
      </div>

      <div class="actions-grid">
        <div class="action-card">
          <h3>Deposit (Testnet)</h3>
          <div class="form-row">
            <select [(ngModel)]="depositCurrency" class="select">
              <option value="ETH">ETH</option>
              <option value="WBTC">WBTC</option>
              <option value="USDT">USDT</option>
              <option value="BNB">BNB</option>
            </select>
            <input type="number" [(ngModel)]="depositAmount" placeholder="Amount" min="0" step="0.01" class="input" />
          </div>
          <button (click)="deposit()" [disabled]="loading()" class="btn btn-deposit">
            {{ loading() ? 'Processing...' : 'Deposit' }}
          </button>
        </div>

        <div class="action-card">
          <h3>Withdraw</h3>
          <div class="form-row">
            <select [(ngModel)]="withdrawCurrency" class="select">
              <option value="ETH">ETH</option>
              <option value="WBTC">WBTC</option>
              <option value="USDT">USDT</option>
              <option value="BNB">BNB</option>
            </select>
            <input type="number" [(ngModel)]="withdrawAmount" placeholder="Amount" min="0" step="0.01" class="input" />
          </div>
          <input type="text" [(ngModel)]="withdrawAddress" placeholder="Destination address (0x...)" class="input full" />
          <button (click)="withdraw()" [disabled]="loading()" class="btn btn-withdraw">
            {{ loading() ? 'Processing...' : 'Withdraw' }}
          </button>
        </div>
      </div>

      <div class="transactions-section">
        <h2>Transaction History</h2>
        @if (transactions().length === 0) {
          <p class="empty">No transactions yet.</p>
        }
        <div class="tx-list">
          @for (tx of transactions(); track tx.id) {
            <div class="tx-row">
              <div class="tx-info">
                <span class="tx-type" [class]="'tx-' + tx.type.toLowerCase()">{{ tx.type }}</span>
                <span class="tx-desc">{{ tx.description }}</span>
              </div>
              <div class="tx-amount">
                <span [class]="tx.type === 'Deposit' || tx.type === 'BetPayout' || tx.type === 'Refund' ? 'positive' : 'negative'">
                  {{ tx.type === 'Deposit' || tx.type === 'BetPayout' || tx.type === 'Refund' ? '+' : '-' }}{{ tx.amount | number:'1.4-4' }} {{ tx.currency }}
                </span>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wallet-page h1 { color: #fff; margin: 0 0 1.5rem; }
    .wallets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .wallet-card {
      background: #1a1a2e;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 1.25rem;
    }
    .wallet-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .currency-badge { background: rgba(0,212,255,0.15); color: #00d4ff; padding: 0.2rem 0.6rem; border-radius: 8px; font-weight: 700; font-size: 0.85rem; }
    .network { color: #666; font-size: 0.7rem; }
    .balance { color: #fff; font-size: 1.6rem; font-weight: 700; }
    .balance-detail { color: #888; font-size: 0.8rem; margin: 0.25rem 0; }
    .frozen { color: #ffaa00; }
    .address { margin-top: 0.5rem; }
    .address small { color: #555; font-size: 0.65rem; word-break: break-all; }
    .actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    @media (max-width: 768px) { .actions-grid { grid-template-columns: 1fr; } }
    .action-card { background: #1a1a2e; border: 1px solid #333; border-radius: 12px; padding: 1.25rem; }
    .action-card h3 { color: #fff; margin: 0 0 1rem; font-size: 1rem; }
    .form-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
    .select, .input {
      padding: 0.6rem;
      border: 1px solid #333;
      border-radius: 8px;
      background: #16213e;
      color: #fff;
      font-size: 0.9rem;
    }
    .select { width: 120px; }
    .input { flex: 1; }
    .input.full { width: 100%; margin-bottom: 0.5rem; box-sizing: border-box; }
    .btn {
      width: 100%;
      padding: 0.6rem;
      border: none;
      border-radius: 8px;
      color: #fff;
      font-weight: 600;
      cursor: pointer;
      margin-top: 0.5rem;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-deposit { background: linear-gradient(135deg, #00c853, #00a844); }
    .btn-withdraw { background: linear-gradient(135deg, #ff6b00, #ff4444); }
    .error-msg { background: #ff4444; color: #fff; padding: 0.5rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem; }
    .success-msg { background: #00c853; color: #fff; padding: 0.5rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem; }
    .transactions-section { background: #1a1a2e; border: 1px solid #333; border-radius: 12px; padding: 1.25rem; }
    .transactions-section h2 { color: #fff; margin: 0 0 1rem; font-size: 1.1rem; }
    .empty { color: #666; }
    .tx-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .tx-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.6rem;
      border: 1px solid #2a2a4a;
      border-radius: 8px;
    }
    .tx-info { display: flex; flex-direction: column; }
    .tx-type { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; margin-bottom: 0.15rem; }
    .tx-deposit { color: #00c853; }
    .tx-withdraw { color: #ff4444; }
    .tx-betstake { color: #ffaa00; }
    .tx-betpayout { color: #00c853; }
    .tx-housefee { color: #888; }
    .tx-penalty { color: #ff4444; }
    .tx-refund { color: #00d4ff; }
    .tx-desc { color: #aaa; font-size: 0.8rem; }
    .tx-amount { font-weight: 600; font-size: 0.9rem; }
    .positive { color: #00c853; }
    .negative { color: #ff4444; }
  `]
})
export class WalletComponent implements OnInit {
  wallets = signal<WalletDto[]>([]);
  transactions = signal<TransactionDto[]>([]);
  loading = signal(false);
  error = signal('');
  successMsg = signal('');

  depositCurrency = 'ETH';
  depositAmount = 0;
  withdrawCurrency = 'ETH';
  withdrawAmount = 0;
  withdrawAddress = '';

  constructor(private walletService: WalletService) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      const [wallets, txs] = await Promise.all([
        this.walletService.getWallets(),
        this.walletService.getTransactions()
      ]);
      this.wallets.set(wallets);
      this.transactions.set(txs);
    } catch (e: any) {
      this.error.set(e.message);
    }
  }

  async deposit() {
    this.error.set(''); this.successMsg.set('');
    if (this.depositAmount <= 0) { this.error.set('Amount must be greater than 0'); return; }
    this.loading.set(true);
    try {
      await this.walletService.deposit({ currency: this.depositCurrency, amount: this.depositAmount });
      this.successMsg.set(`Deposited ${this.depositAmount} ${this.depositCurrency} successfully!`);
      this.depositAmount = 0;
      await this.loadData();
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }

  async withdraw() {
    this.error.set(''); this.successMsg.set('');
    if (this.withdrawAmount <= 0) { this.error.set('Amount must be greater than 0'); return; }
    if (!this.withdrawAddress) { this.error.set('Destination address is required'); return; }
    this.loading.set(true);
    try {
      await this.walletService.withdraw({
        currency: this.withdrawCurrency,
        amount: this.withdrawAmount,
        destinationAddress: this.withdrawAddress
      });
      this.successMsg.set(`Withdrew ${this.withdrawAmount} ${this.withdrawCurrency} successfully!`);
      this.withdrawAmount = 0;
      this.withdrawAddress = '';
      await this.loadData();
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }
}
