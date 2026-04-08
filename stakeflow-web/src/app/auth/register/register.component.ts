import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>🎲 StakeFlow</h1>
          <p>Create your account</p>
        </div>
        <h2>Register</h2>
        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }
        <form (ngSubmit)="onRegister()">
          <div class="form-group">
            <label for="displayName">Display Name</label>
            <input id="displayName" type="text" [(ngModel)]="displayName" name="displayName" placeholder="CryptoKing99" required />
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" [(ngModel)]="email" name="email" placeholder="you@example.com" required />
          </div>
          <div class="form-group">
            <label for="password">Password (min. 6 chars)</label>
            <input id="password" type="password" [(ngModel)]="password" name="password" placeholder="••••••" required minlength="6" />
          </div>
          <button type="submit" [disabled]="loading()" class="btn-primary">
            {{ loading() ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>
        <p class="auth-footer">
          Already have an account? <a routerLink="/login">Login</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    }
    .auth-card {
      background: #1a1a2e;
      border: 1px solid #333;
      border-radius: 16px;
      padding: 2.5rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }
    .auth-header { text-align: center; margin-bottom: 1.5rem; }
    .auth-header h1 { color: #00d4ff; font-size: 2rem; margin: 0; }
    .auth-header p { color: #888; margin: 0.25rem 0 0; }
    h2 { color: #fff; margin: 0 0 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; color: #aaa; margin-bottom: 0.25rem; font-size: 0.85rem; }
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #333;
      border-radius: 8px;
      background: #16213e;
      color: #fff;
      font-size: 1rem;
      box-sizing: border-box;
    }
    input:focus { border-color: #00d4ff; outline: none; }
    .btn-primary {
      width: 100%;
      padding: 0.75rem;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #00d4ff, #0090ff);
      color: #fff;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 0.5rem;
    }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .error-msg { background: #ff4444; color: #fff; padding: 0.5rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem; }
    .auth-footer { text-align: center; color: #888; margin-top: 1rem; }
    .auth-footer a { color: #00d4ff; text-decoration: none; }
  `]
})
export class RegisterComponent {
  displayName = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  async onRegister() {
    this.error.set('');
    this.loading.set(true);
    try {
      await this.authService.register({
        email: this.email,
        password: this.password,
        displayName: this.displayName
      });
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.error.set(e.message || 'Registration failed');
    } finally {
      this.loading.set(false);
    }
  }
}
