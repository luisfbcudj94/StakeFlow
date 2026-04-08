import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BetService } from '../../core/services/bet.service';
import { AuthService } from '../../core/services/auth.service';
import { BetDto } from '../../core/models/api.models';

@Component({
  selector: 'app-bet-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bet-detail">
      @if (loading()) {
        <p class="loading-text">Loading bet...</p>
      }

      @if (error()) {
        <div class="error-msg">{{ error() }}</div>
      }
      @if (successMsg()) {
        <div class="success-msg">{{ successMsg() }}</div>
      }

      @if (bet(); as b) {
        <div class="bet-header">
          <div>
            <span class="badge" [class]="'badge-' + b.status.toLowerCase()">{{ b.status }}</span>
            <span class="currency-badge">{{ b.currency }}</span>
          </div>
          <div class="amount-display">{{ b.amount }} {{ b.currency }} <span class="per-side">per side</span></div>
        </div>

        <h1>{{ b.title }}</h1>
        @if (b.description) {
          <p class="desc">{{ b.description }}</p>
        }

        <div class="options-display">
          <div class="option-card option-a" [class.winner]="b.winningSide === 'A'">
            <div class="option-header">
              <span class="option-label">Option A</span>
              @if (b.winningSide === 'A') { <span class="winner-badge">🏆 Winner</span> }
            </div>
            <p>{{ b.optionA }}</p>
            @for (p of b.participants; track p.userId) {
              @if (p.chosenOption === 'A') {
                <div class="participant">{{ p.displayName }}
                  @if (p.reportedWinner) { <span class="reported">(reported: {{ p.reportedWinner }})</span> }
                </div>
              }
            }
          </div>
          <div class="vs">VS</div>
          <div class="option-card option-b" [class.winner]="b.winningSide === 'B'">
            <div class="option-header">
              <span class="option-label">Option B</span>
              @if (b.winningSide === 'B') { <span class="winner-badge">🏆 Winner</span> }
            </div>
            <p>{{ b.optionB }}</p>
            @for (p of b.participants; track p.userId) {
              @if (p.chosenOption === 'B') {
                <div class="participant">{{ p.displayName }}
                  @if (p.reportedWinner) { <span class="reported">(reported: {{ p.reportedWinner }})</span> }
                </div>
              }
            }
          </div>
        </div>

        <div class="pool-info">
          <p>💰 Total pool: <strong>{{ b.amount * 2 }} {{ b.currency }}</strong></p>
          <p>🏠 House fee (10%): <strong>{{ b.amount * 2 * 0.1 }} {{ b.currency }}</strong></p>
          <p>🏆 Winner takes: <strong>{{ b.amount * 2 * 0.9 }} {{ b.currency }}</strong></p>
        </div>

        <div class="meta-info">
          <p>Created: {{ b.createdAt | date:'medium' }}</p>
          <p>Expires: {{ b.expiresAt | date:'medium' }}</p>
          @if (b.matchedAt) { <p>Matched: {{ b.matchedAt | date:'medium' }}</p> }
          @if (b.resolutionDeadline) { <p>Resolution deadline: {{ b.resolutionDeadline | date:'medium' }}</p> }
          @if (b.resolvedAt) { <p>Resolved: {{ b.resolvedAt | date:'medium' }}</p> }
        </div>

        <!-- Actions -->
        @if (b.status === 'Open' && !isCreator()) {
          <div class="actions">
            <h3>Join this bet</h3>
            <p class="action-desc">You'll stake <strong>{{ b.amount }} {{ b.currency }}</strong> and pick the opposite option.</p>
            <button (click)="joinBet()" [disabled]="actionLoading()" class="btn btn-join">
              {{ actionLoading() ? 'Joining...' : 'Join Bet (Option B)' }}
            </button>
          </div>
        }

        @if ((b.status === 'Matched' || b.status === 'PendingResolution') && isParticipant() && !hasReported()) {
          <div class="actions">
            <h3>Report Result</h3>
            <p class="action-desc">Which option won?</p>
            <div class="resolve-buttons">
              <button (click)="resolve('A')" [disabled]="actionLoading()" class="btn btn-resolve-a">
                Option A wins: {{ b.optionA }}
              </button>
              <button (click)="resolve('B')" [disabled]="actionLoading()" class="btn btn-resolve-b">
                Option B wins: {{ b.optionB }}
              </button>
            </div>
          </div>
        }

        @if ((b.status === 'Matched' || b.status === 'PendingResolution') && isParticipant() && hasReported()) {
          <div class="actions waiting">
            <p>⏳ You reported. Waiting for the other participant to report...</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .bet-detail h1 { color: #fff; margin: 0.5rem 0 0.25rem; font-size: 1.5rem; }
    .loading-text { color: #888; }
    .bet-header { display: flex; justify-content: space-between; align-items: center; }
    .badge { padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; margin-right: 0.5rem; }
    .badge-open { background: rgba(0,212,255,0.15); color: #00d4ff; }
    .badge-matched { background: rgba(255,170,0,0.15); color: #ffaa00; }
    .badge-pendingresolution { background: rgba(255,136,0,0.15); color: #ff8800; }
    .badge-resolved { background: rgba(0,200,83,0.15); color: #00c853; }
    .badge-disputed { background: rgba(255,68,68,0.15); color: #ff4444; }
    .badge-cancelled { background: rgba(136,136,136,0.15); color: #888; }
    .currency-badge { background: rgba(0,212,255,0.15); color: #00d4ff; padding: 0.2rem 0.5rem; border-radius: 8px; font-weight: 700; font-size: 0.75rem; }
    .amount-display { color: #fff; font-size: 1.5rem; font-weight: 700; }
    .per-side { color: #888; font-size: 0.8rem; font-weight: 400; }
    .desc { color: #aaa; margin: 0 0 1rem; }
    .options-display { display: flex; align-items: stretch; gap: 1rem; margin: 1.5rem 0; }
    .option-card { flex: 1; background: #1a1a2e; border: 1px solid #333; border-radius: 12px; padding: 1rem; }
    .option-card.winner { border-color: #00c853; box-shadow: 0 0 20px rgba(0,200,83,0.15); }
    .option-a { border-left: 3px solid #00c853; }
    .option-b { border-left: 3px solid #ff4444; }
    .option-header { display: flex; justify-content: space-between; align-items: center; }
    .option-label { color: #888; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .winner-badge { color: #00c853; font-size: 0.85rem; }
    .option-card p { color: #fff; font-weight: 600; margin: 0.5rem 0; }
    .participant { color: #888; font-size: 0.8rem; padding: 0.25rem 0; }
    .reported { color: #ffaa00; font-size: 0.7rem; }
    .vs { color: #555; font-weight: 700; display: flex; align-items: center; }
    .pool-info, .meta-info {
      background: #1a1a2e;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    .pool-info p, .meta-info p { color: #aaa; margin: 0.2rem 0; font-size: 0.9rem; }
    .pool-info strong, .meta-info strong { color: #fff; }
    .actions {
      background: #1a1a2e;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 1.25rem;
      margin-top: 1rem;
    }
    .actions h3 { color: #fff; margin: 0 0 0.5rem; }
    .action-desc { color: #aaa; font-size: 0.9rem; margin: 0 0 1rem; }
    .action-desc strong { color: #fff; }
    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      color: #fff;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.95rem;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-join { background: linear-gradient(135deg, #00d4ff, #0090ff); width: 100%; }
    .resolve-buttons { display: flex; gap: 1rem; }
    .btn-resolve-a { background: linear-gradient(135deg, #00c853, #00a844); flex: 1; }
    .btn-resolve-b { background: linear-gradient(135deg, #ff4444, #cc0000); flex: 1; }
    .waiting { text-align: center; }
    .waiting p { color: #ffaa00; font-size: 0.95rem; }
    .error-msg { background: #ff4444; color: #fff; padding: 0.5rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem; }
    .success-msg { background: #00c853; color: #fff; padding: 0.5rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem; }
  `]
})
export class BetDetailComponent implements OnInit {
  bet = signal<BetDto | null>(null);
  loading = signal(true);
  actionLoading = signal(false);
  error = signal('');
  successMsg = signal('');

  constructor(
    private route: ActivatedRoute,
    private betService: BetService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    const betId = this.route.snapshot.paramMap.get('betId');
    if (!betId) { this.router.navigate(['/bets/explore']); return; }

    try {
      const bet = await this.betService.getBetById(betId);
      this.bet.set(bet);
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }

  isCreator(): boolean {
    return this.bet()?.creatorId === this.authService.currentUser()?.id;
  }

  isParticipant(): boolean {
    const userId = this.authService.currentUser()?.id;
    return !!this.bet()?.participants.some(p => p.userId === userId);
  }

  hasReported(): boolean {
    const userId = this.authService.currentUser()?.id;
    const participant = this.bet()?.participants.find(p => p.userId === userId);
    return !!participant?.reportedWinner;
  }

  async joinBet() {
    const bet = this.bet();
    if (!bet) return;
    this.error.set(''); this.successMsg.set('');
    this.actionLoading.set(true);
    try {
      const updated = await this.betService.joinBet(bet.id, { chosenOption: 'B' });
      this.bet.set(updated);
      this.successMsg.set('You joined the bet! Good luck!');
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.actionLoading.set(false);
    }
  }

  async resolve(winningSide: string) {
    const bet = this.bet();
    if (!bet) return;
    this.error.set(''); this.successMsg.set('');
    this.actionLoading.set(true);
    try {
      const updated = await this.betService.resolveBet(bet.id, { winningSide });
      this.bet.set(updated);
      this.successMsg.set('Result reported successfully!');
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.actionLoading.set(false);
    }
  }
}
