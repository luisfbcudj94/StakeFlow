using StakeFlow.Api.Models;

namespace StakeFlow.Api.Services;

public class BetResolutionService
{
    private readonly CosmosDbService _db;
    private readonly WalletService _walletService;
    private const decimal HouseCommission = 0.10m; // 10% commission
    private const decimal DisputePenalty = 0.50m;   // 50% penalty on no consensus

    public BetResolutionService(CosmosDbService db, WalletService walletService)
    {
        _db = db;
        _walletService = walletService;
    }

    public async Task<Bet> ReportResultAsync(string userId, string betId, string winningSide)
    {
        if (winningSide != "A" && winningSide != "B")
            throw new ArgumentException("WinningSide must be 'A' or 'B'.");

        var bet = await GetBetEntityAsync(betId)
            ?? throw new InvalidOperationException("Bet not found.");

        if (bet.Status != BetStatus.Matched && bet.Status != BetStatus.PendingResolution)
            throw new InvalidOperationException("This bet cannot be resolved in its current state.");

        var participant = bet.Participants.FirstOrDefault(p => p.UserId == userId)
            ?? throw new InvalidOperationException("You are not a participant in this bet.");

        if (participant.ReportedWinner != null)
            throw new InvalidOperationException("You have already reported a result.");

        // Delete bet from old partition
        var oldPartitionKey = bet.PartitionKey;

        participant.ReportedWinner = winningSide;
        participant.ReportedAt = DateTime.UtcNow;

        // Check if both participants have reported
        var allReported = bet.Participants.All(p => p.ReportedWinner != null);

        if (allReported)
        {
            var reports = bet.Participants.Select(p => p.ReportedWinner).Distinct().ToList();

            if (reports.Count == 1)
            {
                // Consensus: both agree on the winner
                await ResolveWithConsensusAsync(bet, reports.First()!);
            }
            else
            {
                // Dispute: no consensus
                await ResolveWithDisputeAsync(bet);
            }
        }
        else
        {
            // First report: move to PendingResolution
            await _db.DeleteItemAsync("bets", bet.Id, oldPartitionKey);
            bet.Status = BetStatus.PendingResolution;
            bet.ResolutionDeadline = DateTime.UtcNow.AddHours(48);
            await _db.CreateItemAsync("bets", bet, bet.PartitionKey);
        }

        return bet;
    }

    private async Task ResolveWithConsensusAsync(Bet bet, string winningSide)
    {
        var oldPartitionKey = bet.PartitionKey;
        var totalPool = bet.Amount * 2;
        var houseFee = totalPool * HouseCommission;
        var winnerPayout = totalPool - houseFee;

        var winner = bet.Participants.First(p => p.ChosenOption == winningSide);
        var loser = bet.Participants.First(p => p.ChosenOption != winningSide);

        // Deduct frozen balances from both participants
        await _walletService.DeductFrozenAsync(winner.UserId, bet.Currency, bet.Amount);
        await _walletService.DeductFrozenAsync(loser.UserId, bet.Currency, bet.Amount);

        // Credit winner
        await _walletService.CreditAsync(winner.UserId, bet.Currency, winnerPayout);

        // Record transactions
        await _db.CreateItemAsync("transactions", new Transaction
        {
            UserId = winner.UserId,
            Type = TransactionType.BetPayout,
            Amount = winnerPayout,
            Currency = bet.Currency,
            BetId = bet.Id,
            Description = $"Won bet: {bet.Title} | Payout: {winnerPayout} {bet.Currency}"
        }, winner.UserId);

        await _db.CreateItemAsync("transactions", new Transaction
        {
            UserId = loser.UserId,
            Type = TransactionType.BetStake,
            Amount = bet.Amount,
            Currency = bet.Currency,
            BetId = bet.Id,
            Description = $"Lost bet: {bet.Title} | Lost: {bet.Amount} {bet.Currency}"
        }, loser.UserId);

        await _db.CreateItemAsync("transactions", new Transaction
        {
            UserId = "house",
            Type = TransactionType.HouseFee,
            Amount = houseFee,
            Currency = bet.Currency,
            BetId = bet.Id,
            Description = $"House fee from bet: {bet.Title}"
        }, "house");

        // Update bet status
        await _db.DeleteItemAsync("bets", bet.Id, oldPartitionKey);
        bet.Status = BetStatus.Resolved;
        bet.WinningSide = winningSide;
        bet.ResolvedAt = DateTime.UtcNow;
        await _db.CreateItemAsync("bets", bet, bet.PartitionKey);
    }

    public async Task ResolveWithDisputeAsync(Bet bet)
    {
        var oldPartitionKey = bet.PartitionKey;
        var totalPool = bet.Amount * 2;
        var housePenalty = totalPool * DisputePenalty;
        var refundPerParticipant = (totalPool - housePenalty) / 2;

        foreach (var participant in bet.Participants)
        {
            // Deduct frozen balances
            await _walletService.DeductFrozenAsync(participant.UserId, bet.Currency, bet.Amount);

            // Refund partial
            await _walletService.CreditAsync(participant.UserId, bet.Currency, refundPerParticipant);

            await _db.CreateItemAsync("transactions", new Transaction
            {
                UserId = participant.UserId,
                Type = TransactionType.Refund,
                Amount = refundPerParticipant,
                Currency = bet.Currency,
                BetId = bet.Id,
                Description = $"Dispute refund for bet: {bet.Title} | Refunded: {refundPerParticipant} {bet.Currency}"
            }, participant.UserId);

            await _db.CreateItemAsync("transactions", new Transaction
            {
                UserId = participant.UserId,
                Type = TransactionType.Penalty,
                Amount = housePenalty / 2,
                Currency = bet.Currency,
                BetId = bet.Id,
                Description = $"Dispute penalty for bet: {bet.Title}"
            }, participant.UserId);
        }

        // House fee
        await _db.CreateItemAsync("transactions", new Transaction
        {
            UserId = "house",
            Type = TransactionType.HouseFee,
            Amount = housePenalty,
            Currency = bet.Currency,
            BetId = bet.Id,
            Description = $"Dispute penalty collected from bet: {bet.Title}"
        }, "house");

        // Update bet status
        await _db.DeleteItemAsync("bets", bet.Id, oldPartitionKey);
        bet.Status = BetStatus.Disputed;
        bet.ResolvedAt = DateTime.UtcNow;
        await _db.CreateItemAsync("bets", bet, bet.PartitionKey);
    }

    public async Task ExpireOpenBetsAsync()
    {
        var expiredBets = await _db.QueryItemsAsync<Bet>(
            "bets",
            $"SELECT * FROM c WHERE c.partitionKey = 'Open' AND c.expiresAt < '{DateTime.UtcNow:O}'",
            "Open");

        foreach (var bet in expiredBets)
        {
            // Refund creator
            var creator = bet.Participants.First();
            await _walletService.UnfreezeBalanceAsync(creator.UserId, bet.Currency, bet.Amount);

            await _db.CreateItemAsync("transactions", new Transaction
            {
                UserId = creator.UserId,
                Type = TransactionType.Refund,
                Amount = bet.Amount,
                Currency = bet.Currency,
                BetId = bet.Id,
                Description = $"Bet expired, refund: {bet.Title}"
            }, creator.UserId);

            // Update status
            await _db.DeleteItemAsync("bets", bet.Id, bet.PartitionKey);
            bet.Status = BetStatus.Cancelled;
            await _db.CreateItemAsync("bets", bet, bet.PartitionKey);
        }
    }

    public async Task ResolveTimedOutBetsAsync()
    {
        var timedOut = await _db.QueryItemsAsync<Bet>(
            "bets",
            $"SELECT * FROM c WHERE c.partitionKey = 'PendingResolution' AND c.resolutionDeadline < '{DateTime.UtcNow:O}'",
            "PendingResolution");

        foreach (var bet in timedOut)
        {
            await ResolveWithDisputeAsync(bet);
        }
    }

    private async Task<Bet?> GetBetEntityAsync(string betId)
    {
        var bets = await _db.QueryItemsByCrossPartitionAsync<Bet>(
            "bets", $"SELECT * FROM c WHERE c.id = '{betId}'");
        return bets.FirstOrDefault();
    }
}
