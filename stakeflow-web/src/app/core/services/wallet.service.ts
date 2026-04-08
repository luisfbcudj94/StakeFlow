import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, WalletDto, TransactionDto,
  DepositRequest, WithdrawRequest
} from '../models/api.models';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  async getWallets(): Promise<WalletDto[]> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<WalletDto[]>>(`${this.apiUrl}/wallets`)
    );
    if (!res.success || !res.data) throw new Error(res.error || 'Failed to get wallets');
    return res.data;
  }

  async deposit(request: DepositRequest): Promise<WalletDto> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<WalletDto>>(`${this.apiUrl}/wallets/deposit`, request)
    );
    if (!res.success || !res.data) throw new Error(res.error || 'Deposit failed');
    return res.data;
  }

  async withdraw(request: WithdrawRequest): Promise<WalletDto> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<WalletDto>>(`${this.apiUrl}/wallets/withdraw`, request)
    );
    if (!res.success || !res.data) throw new Error(res.error || 'Withdrawal failed');
    return res.data;
  }

  async getTransactions(): Promise<TransactionDto[]> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<TransactionDto[]>>(`${this.apiUrl}/wallets/transactions`)
    );
    if (!res.success || !res.data) throw new Error(res.error || 'Failed to get transactions');
    return res.data;
  }
}
