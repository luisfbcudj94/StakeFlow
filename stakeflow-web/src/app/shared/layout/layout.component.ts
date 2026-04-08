import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell">
      <nav class="sidebar">
        <div class="logo">
          <h2>🎲 StakeFlow</h2>
        </div>
        <ul class="nav-links">
          <li>
            <a routerLink="/dashboard" routerLinkActive="active">
              <span class="icon">📊</span> Dashboard
            </a>
          </li>
          <li>
            <a routerLink="/bets/explore" routerLinkActive="active">
              <span class="icon">🔍</span> Explore Bets
            </a>
          </li>
          <li>
            <a routerLink="/bets/create" routerLinkActive="active">
              <span class="icon">➕</span> Create Bet
            </a>
          </li>
          <li>
            <a routerLink="/bets/my" routerLinkActive="active">
              <span class="icon">🎯</span> My Bets
            </a>
          </li>
          <li>
            <a routerLink="/wallet" routerLinkActive="active">
              <span class="icon">💰</span> Wallet
            </a>
          </li>
        </ul>
        <div class="user-info">
          @if (authService.currentUser(); as user) {
            <div class="user-avatar">{{ user.displayName[0] }}</div>
            <div class="user-details">
              <span class="user-name">{{ user.displayName }}</span>
              <span class="user-email">{{ user.email }}</span>
            </div>
          }
          <button class="btn-logout" (click)="authService.logout()">Logout</button>
        </div>
      </nav>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-shell { display: flex; min-height: 100vh; background: #0f0c29; }
    .sidebar {
      width: 260px;
      background: #1a1a2e;
      border-right: 1px solid #333;
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 100;
    }
    .logo { padding: 1.5rem; border-bottom: 1px solid #333; }
    .logo h2 { color: #00d4ff; margin: 0; font-size: 1.4rem; }
    .nav-links { list-style: none; padding: 1rem 0; margin: 0; flex: 1; }
    .nav-links li a {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.5rem;
      color: #aaa;
      text-decoration: none;
      font-size: 0.95rem;
      transition: all 0.2s;
    }
    .nav-links li a:hover { color: #fff; background: rgba(255,255,255,0.05); }
    .nav-links li a.active {
      color: #00d4ff;
      background: rgba(0,212,255,0.1);
      border-right: 3px solid #00d4ff;
    }
    .icon { font-size: 1.1rem; }
    .user-info {
      padding: 1rem 1.5rem;
      border-top: 1px solid #333;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00d4ff, #0090ff);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      font-size: 1rem;
    }
    .user-details { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .user-name { color: #fff; font-size: 0.85rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; }
    .user-email { color: #666; font-size: 0.7rem; overflow: hidden; text-overflow: ellipsis; }
    .btn-logout {
      width: 100%;
      margin-top: 0.5rem;
      padding: 0.4rem;
      border: 1px solid #444;
      border-radius: 6px;
      background: transparent;
      color: #aaa;
      cursor: pointer;
      font-size: 0.8rem;
    }
    .btn-logout:hover { background: rgba(255,68,68,0.1); color: #ff4444; border-color: #ff4444; }
    .content {
      flex: 1;
      margin-left: 260px;
      padding: 2rem;
      overflow-y: auto;
    }
  `]
})
export class LayoutComponent {
  constructor(public authService: AuthService) {}
}
