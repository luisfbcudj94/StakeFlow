namespace StakeFlow.Api.Models.Dto;

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = new();
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string EthAddress { get; set; } = string.Empty;
    public string BscAddress { get; set; } = string.Empty;
}

public class CreateBetRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public int ExpiresInHours { get; set; } = 24;
}

public class JoinBetRequest
{
    public string ChosenOption { get; set; } = string.Empty; // "A" or "B"
}

public class ResolveBetRequest
{
    public string WinningSide { get; set; } = string.Empty; // "A" or "B"
}

public class DepositRequest
{
    public string Currency { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class WithdrawRequest
{
    public string Currency { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string DestinationAddress { get; set; } = string.Empty;
}

public class WalletDto
{
    public string Id { get; set; } = string.Empty;
    public string Currency { get; set; } = string.Empty;
    public decimal Balance { get; set; }
    public decimal FrozenBalance { get; set; }
    public decimal AvailableBalance => Balance - FrozenBalance;
    public string Network { get; set; } = string.Empty;
    public string DepositAddress { get; set; } = string.Empty;
}

public class BetDto
{
    public string Id { get; set; } = string.Empty;
    public string CreatorId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public List<BetParticipantDto> Participants { get; set; } = new();
    public string? WinningSide { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? MatchedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime? ResolutionDeadline { get; set; }
}

public class BetParticipantDto
{
    public string UserId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string ChosenOption { get; set; } = string.Empty;
    public string? ReportedWinner { get; set; }
}

public class TransactionDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string? BetId { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Error { get; set; }

    public static ApiResponse<T> Ok(T data) => new() { Success = true, Data = data };
    public static ApiResponse<T> Fail(string error) => new() { Success = false, Error = error };
}
