import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, AuthResponse, UserDto,
  RegisterRequest, LoginRequest
} from '../models/api.models';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly tokenKey = 'stakeflow_token';

  currentUser = signal<UserDto | null>(null);
  isLoggedIn = computed(() => !!this.currentUser());

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromToken();
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/register`, request)
    );
    if (!res.success || !res.data) throw new Error(res.error || 'Registration failed');
    this.setSession(res.data);
    return res.data;
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/login`, request)
    );
    if (!res.success || !res.data) throw new Error(res.error || 'Login failed');
    this.setSession(res.data);
    return res.data;
  }

  async getProfile(): Promise<UserDto> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<UserDto>>(`${this.apiUrl}/auth/me`)
    );
    if (!res.success || !res.data) throw new Error(res.error || 'Failed to get profile');
    this.currentUser.set(res.data);
    return res.data;
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
    }
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  private setSession(auth: AuthResponse): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.tokenKey, auth.token);
    }
    this.currentUser.set(auth.user);
  }

  private loadUserFromToken(): void {
    const token = this.getToken();
    if (token) {
      this.getProfile().catch(() => this.logout());
    }
  }
}
