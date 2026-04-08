using StakeFlow.Api.Models;
using StakeFlow.Api.Models.Dto;

namespace StakeFlow.Api.Services;

public class WalletService
{
    private readonly CosmosDbService _db;

    public WalletService(CosmosDbService db)
    {
        _db = db;
    }

    public async Task CreateWalletsForUserAsync(User user)
    {
        var currencies = new[] { Currency.ETH, Currency.WBTC, Currency.USDT, Currency.BNB };

        foreach (var currency in currencies)
        {
            var network = CryptoService.GetNetworkForCurrency(currency);
            var address = currency == Currency.BNB ? user.BscAddress : user.EthAddress;

            var wallet = new Wallet
            {
                UserId = user.Id,
                Currency = currency,
                Balance = 0,
                FrozenBalance = 0,
                Network = network,
                DepositAddress = address
            };

            await _db.CreateItemAsync("wallets", wallet, wallet.PartitionKey);
        }
    }

    public async Task<List<WalletDto>> GetWalletsAsync(string userId)
    {
        var wallets = await _db.QueryItemsAsync<Wallet>(
            "wallets",
            $"SELECT * FROM c WHERE c.userId = '{userId}'",
            userId);

        return wallets.Select(MapWalletDto).ToList();
    }

    public async Task<Wallet?> GetWalletAsync(string userId, Currency currency)
    {
        var wallets = await _db.QueryItemsAsync<Wallet>(
            "wallets",
            $"SELECT * FROM c WHERE c.userId = '{userId}' AND c.currency = '{currency}'",
            userId);

        return wallets.FirstOrDefault();
    }

    public async Task<WalletDto> DepositAsync(string userId, DepositRequest request)
    {
        if (!Enum.TryParse<Currency>(request.Currency, true, out var currency))
            throw new ArgumentException($"Invalid currency: {request.Currency}");

        if (request.Amount <= 0)
            throw new ArgumentException("Amount must be greater than zero.");

        var wallet = await GetWalletAsync(userId, currency)
            ?? throw new InvalidOperationException("Wallet not found.");

        wallet.Balance += request.Amount;
        await _db.UpsertItemAsync("wallets", wallet, wallet.PartitionKey);

        // Record transaction
        var tx = new Transaction
        {
            UserId = userId,
            Type = TransactionType.Deposit,
            Amount = request.Amount,
            Currency = currency,
            Description = $"Deposit {request.Amount} {currency} (testnet)"
        };
        await _db.CreateItemAsync("transactions", tx, tx.PartitionKey);

        return MapWalletDto(wallet);
    }

    public async Task<WalletDto> WithdrawAsync(string userId, WithdrawRequest request)
    {
        if (!Enum.TryParse<Currency>(request.Currency, true, out var currency))
            throw new ArgumentException($"Invalid currency: {request.Currency}");

        if (request.Amount <= 0)
            throw new ArgumentException("Amount must be greater than zero.");

        var wallet = await GetWalletAsync(userId, currency)
            ?? throw new InvalidOperationException("Wallet not found.");

        var available = wallet.Balance - wallet.FrozenBalance;
        if (request.Amount > available)
            throw new InvalidOperationException($"Insufficient available balance. Available: {available} {currency}");

        wallet.Balance -= request.Amount;
        await _db.UpsertItemAsync("wallets", wallet, wallet.PartitionKey);

        var tx = new Transaction
        {
            UserId = userId,
            Type = TransactionType.Withdraw,
            Amount = request.Amount,
            Currency = currency,
            Description = $"Withdraw {request.Amount} {currency} to {request.DestinationAddress}"
        };
        await _db.CreateItemAsync("transactions", tx, tx.PartitionKey);

        return MapWalletDto(wallet);
    }

    public async Task FreezeBalanceAsync(string userId, Currency currency, decimal amount)
    {
        var wallet = await GetWalletAsync(userId, currency)
            ?? throw new InvalidOperationException("Wallet not found.");

        var available = wallet.Balance - wallet.FrozenBalance;
        if (amount > available)
            throw new InvalidOperationException($"Insufficient available balance. Available: {available} {currency}");

        wallet.FrozenBalance += amount;
        await _db.UpsertItemAsync("wallets", wallet, wallet.PartitionKey);
    }

    public async Task UnfreezeBalanceAsync(string userId, Currency currency, decimal amount)
    {
        var wallet = await GetWalletAsync(userId, currency)
            ?? throw new InvalidOperationException("Wallet not found.");

        wallet.FrozenBalance -= Math.Min(amount, wallet.FrozenBalance);
        await _db.UpsertItemAsync("wallets", wallet, wallet.PartitionKey);
    }

    public async Task DeductFrozenAsync(string userId, Currency currency, decimal amount)
    {
        var wallet = await GetWalletAsync(userId, currency)
            ?? throw new InvalidOperationException("Wallet not found.");

        wallet.FrozenBalance -= Math.Min(amount, wallet.FrozenBalance);
        wallet.Balance -= amount;
        await _db.UpsertItemAsync("wallets", wallet, wallet.PartitionKey);
    }

    public async Task CreditAsync(string userId, Currency currency, decimal amount)
    {
        var wallet = await GetWalletAsync(userId, currency)
            ?? throw new InvalidOperationException("Wallet not found.");

        wallet.Balance += amount;
        await _db.UpsertItemAsync("wallets", wallet, wallet.PartitionKey);
    }

    public async Task<List<TransactionDto>> GetTransactionsAsync(string userId)
    {
        var txs = await _db.QueryItemsAsync<Transaction>(
            "transactions",
            $"SELECT * FROM c WHERE c.userId = '{userId}' ORDER BY c.createdAt DESC",
            userId);

        return txs.Select(t => new TransactionDto
        {
            Id = t.Id,
            Type = t.Type.ToString(),
            Amount = t.Amount,
            Currency = t.Currency.ToString(),
            BetId = t.BetId,
            Description = t.Description,
            CreatedAt = t.CreatedAt
        }).ToList();
    }

    private static WalletDto MapWalletDto(Wallet w) => new()
    {
        Id = w.Id,
        Currency = w.Currency.ToString(),
        Balance = w.Balance,
        FrozenBalance = w.FrozenBalance,
        Network = w.Network,
        DepositAddress = w.DepositAddress
    };
}
