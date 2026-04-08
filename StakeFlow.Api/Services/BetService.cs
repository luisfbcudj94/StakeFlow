using StakeFlow.Api.Models;
using StakeFlow.Api.Models.Dto;

namespace StakeFlow.Api.Services;

public class BetService
{
    private readonly CosmosDbService _db;
    private readonly WalletService _walletService;

    public BetService(CosmosDbService db, WalletService walletService)
    {
        _db = db;
        _walletService = walletService;
    }

    public async Task<BetDto> CreateBetAsync(string userId, CreateBetRequest request)
    {
        if (!Enum.TryParse<Currency>(request.Currency, true, out var currency))
            throw new ArgumentException($"Invalid currency: {request.Currency}");

        if (request.Amount <= 0)
            throw new ArgumentException("Amount must be greater than zero.");

        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ArgumentException("Title is required.");

        if (string.IsNullOrWhiteSpace(request.OptionA) || string.IsNullOrWhiteSpace(request.OptionB))
            throw new ArgumentException("Both options are required.");

        // Get user display name
        var users = await _db.QueryItemsByCrossPartitionAsync<User>(
            "users", $"SELECT * FROM c WHERE c.id = '{userId}'");
        var user = users.FirstOrDefault()
            ?? throw new InvalidOperationException("User not found.");

        // Freeze the bet amount from the creator's wallet
        await _walletService.FreezeBalanceAsync(userId, currency, request.Amount);

        var bet = new Bet
        {
            CreatorId = userId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            OptionA = request.OptionA.Trim(),
            OptionB = request.OptionB.Trim(),
            Amount = request.Amount,
            Currency = currency,
            Status = BetStatus.Open,
            ExpiresAt = DateTime.UtcNow.AddHours(Math.Max(1, request.ExpiresInHours)),
            Participants = new List<BetParticipant>
            {
                new()
                {
                    UserId = userId,
                    DisplayName = user.DisplayName,
                    ChosenOption = "A" // Creator always picks option A
                }
            }
        };

        await _db.CreateItemAsync("bets", bet, bet.PartitionKey);

        // Record stake transaction
        var tx = new Transaction
        {
            UserId = userId,
            Type = TransactionType.BetStake,
            Amount = request.Amount,
            Currency = currency,
            BetId = bet.Id,
            Description = $"Stake {request.Amount} {currency} on: {bet.Title}"
        };
        await _db.CreateItemAsync("transactions", tx, tx.PartitionKey);

        return MapBetDto(bet);
    }

    public async Task<List<BetDto>> GetOpenBetsAsync(int limit = 50, string? currencyFilter = null)
    {
        var query = "SELECT * FROM c WHERE c.partitionKey = 'Open'";
        if (currencyFilter != null)
            query += $" AND c.currency = '{currencyFilter}'";
        query += " ORDER BY c.createdAt DESC";

        var bets = await _db.QueryItemsAsync<Bet>("bets", query, "Open");

        return bets.Take(limit).Select(MapBetDto).ToList();
    }

    public async Task<BetDto?> GetBetByIdAsync(string betId)
    {
        // Cross-partition query since we don't know the status
        var bets = await _db.QueryItemsByCrossPartitionAsync<Bet>(
            "bets", $"SELECT * FROM c WHERE c.id = '{betId}'");

        var bet = bets.FirstOrDefault();
        return bet == null ? null : MapBetDto(bet);
    }

    public async Task<Bet?> GetBetEntityByIdAsync(string betId)
    {
        var bets = await _db.QueryItemsByCrossPartitionAsync<Bet>(
            "bets", $"SELECT * FROM c WHERE c.id = '{betId}'");

        return bets.FirstOrDefault();
    }

    public async Task<List<BetDto>> GetMyBetsAsync(string userId)
    {
        var bets = await _db.QueryItemsByCrossPartitionAsync<Bet>(
            "bets",
            $"SELECT * FROM c WHERE c.creatorId = '{userId}' OR ARRAY_CONTAINS(c.participants, {{'userId': '{userId}'}}, true) ORDER BY c.createdAt DESC");

        return bets.Select(MapBetDto).ToList();
    }

    public async Task<BetDto> JoinBetAsync(string userId, string betId, JoinBetRequest request)
    {
        if (request.ChosenOption != "A" && request.ChosenOption != "B")
            throw new ArgumentException("ChosenOption must be 'A' or 'B'.");

        var bet = await GetBetEntityByIdAsync(betId)
            ?? throw new InvalidOperationException("Bet not found.");

        if (bet.Status != BetStatus.Open)
            throw new InvalidOperationException("This bet is no longer open.");

        if (bet.CreatorId == userId)
            throw new InvalidOperationException("You cannot join your own bet.");

        if (bet.Participants.Any(p => p.UserId == userId))
            throw new InvalidOperationException("You have already joined this bet.");

        if (DateTime.UtcNow > bet.ExpiresAt)
            throw new InvalidOperationException("This bet has expired.");

        // The joiner must pick the opposite option of the creator
        var creatorOption = bet.Participants.First().ChosenOption;
        if (request.ChosenOption == creatorOption)
            throw new InvalidOperationException($"You must pick the opposite option. Creator chose option {creatorOption}.");

        // Get user display name
        var users = await _db.QueryItemsByCrossPartitionAsync<User>(
            "users", $"SELECT * FROM c WHERE c.id = '{userId}'");
        var user = users.FirstOrDefault()
            ?? throw new InvalidOperationException("User not found.");

        // Freeze the bet amount from the joiner's wallet
        await _walletService.FreezeBalanceAsync(userId, bet.Currency, bet.Amount);

        // Delete old bet (old partition key = "Open")
        await _db.DeleteItemAsync("bets", bet.Id, bet.PartitionKey);

        // Update bet
        bet.Participants.Add(new BetParticipant
        {
            UserId = userId,
            DisplayName = user.DisplayName,
            ChosenOption = request.ChosenOption
        });
        bet.Status = BetStatus.Matched;
        bet.MatchedAt = DateTime.UtcNow;

        // Re-create with new partition key ("Matched")
        await _db.CreateItemAsync("bets", bet, bet.PartitionKey);

        // Record stake transaction
        var tx = new Transaction
        {
            UserId = userId,
            Type = TransactionType.BetStake,
            Amount = bet.Amount,
            Currency = bet.Currency,
            BetId = bet.Id,
            Description = $"Stake {bet.Amount} {bet.Currency} on: {bet.Title}"
        };
        await _db.CreateItemAsync("transactions", tx, tx.PartitionKey);

        return MapBetDto(bet);
    }

    public static BetDto MapBetDto(Bet bet) => new()
    {
        Id = bet.Id,
        CreatorId = bet.CreatorId,
        Title = bet.Title,
        Description = bet.Description,
        OptionA = bet.OptionA,
        OptionB = bet.OptionB,
        Amount = bet.Amount,
        Currency = bet.Currency.ToString(),
        Status = bet.Status.ToString(),
        Participants = bet.Participants.Select(p => new BetParticipantDto
        {
            UserId = p.UserId,
            DisplayName = p.DisplayName,
            ChosenOption = p.ChosenOption,
            ReportedWinner = p.ReportedWinner
        }).ToList(),
        WinningSide = bet.WinningSide,
        CreatedAt = bet.CreatedAt,
        ExpiresAt = bet.ExpiresAt,
        MatchedAt = bet.MatchedAt,
        ResolvedAt = bet.ResolvedAt,
        ResolutionDeadline = bet.ResolutionDeadline
    };
}
