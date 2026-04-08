export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UserDto {
  id: string;
  email: string;
  displayName: string;
  ethAddress: string;
  bscAddress: string;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}

export interface WalletDto {
  id: string;
  currency: string;
  balance: number;
  frozenBalance: number;
  availableBalance: number;
  network: string;
  depositAddress: string;
}

export interface BetParticipantDto {
  userId: string;
  displayName: string;
  chosenOption: string;
  reportedWinner?: string;
}

export interface BetDto {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  optionA: string;
  optionB: string;
  amount: number;
  currency: string;
  status: string;
  participants: BetParticipantDto[];
  winningSide?: string;
  createdAt: string;
  expiresAt: string;
  matchedAt?: string;
  resolvedAt?: string;
  resolutionDeadline?: string;
}

export interface TransactionDto {
  id: string;
  type: string;
  amount: number;
  currency: string;
  betId?: string;
  description: string;
  createdAt: string;
}

export interface CreateBetRequest {
  title: string;
  description: string;
  optionA: string;
  optionB: string;
  amount: number;
  currency: string;
  expiresInHours: number;
}

export interface JoinBetRequest {
  chosenOption: string;
}

export interface ResolveBetRequest {
  winningSide: string;
}

export interface DepositRequest {
  currency: string;
  amount: number;
}

export interface WithdrawRequest {
  currency: string;
  amount: number;
  destinationAddress: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
