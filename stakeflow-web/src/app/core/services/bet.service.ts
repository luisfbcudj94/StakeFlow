import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, BetDto,
  CreateBetRequest, JoinBetRequest, ResolveBetRequest
} from '../models/api.models';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BetService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  async getOpenBets(currency?: string): Promise<BetDto[]> {
    let url = `${this.apiUrl}/bets`;
    if (currency) url += `?currency=${currency}`;
    const res = await firstValueFrom(
      this.http.get<ApiResponse<BetDto[]>>(url)
    );
    if (!res.success || !res.data) throw new Error(res.error || 'Failed to get bets');
    return res.data;
  }

  async getBetById(id: string): Promise<BetDto> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<BetDto>>(`${this.apiUrl}/bets/${id}`)
    );
    if (!res.success || !res.data) throw new Error(res.error || 'Bet not found');
    return res.data;
  }

  async getMyBets(): Promise<BetDto[]> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<BetDto[]>>(`${this.apiUrl}/bets/my`)
    );
    if (!res.success || !res.data) throw new Error(res.error || 'Failed to get bets');
    return res.data;
  }

  async createBet(request: CreateBetRequest): Promise<BetDto> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<BetDto>>(`${this.apiUrl}/bets`, request)
    );
    if (!res.success || !res.data) throw new Error(res.error || 'Failed to create bet');
    return res.data;
  }

  async joinBet(betId: string, request: JoinBetRequest): Promise<BetDto> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<BetDto>>(`${this.apiUrl}/bets/${betId}/join`, request)
    );
    if (!res.success || !res.data) throw new Error(res.error || 'Failed to join bet');
    return res.data;
  }

  async resolveBet(betId: string, request: ResolveBetRequest): Promise<BetDto> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<BetDto>>(`${this.apiUrl}/bets/${betId}/resolve`, request)
    );
    if (!res.success || !res.data) throw new Error(res.error || 'Failed to resolve bet');
    return res.data;
  }
}
