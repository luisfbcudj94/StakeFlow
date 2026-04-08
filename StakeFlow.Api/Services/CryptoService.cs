using System.Security.Cryptography;

namespace StakeFlow.Api.Services;

public static class CryptoService
{
    /// <summary>
    /// Generates a random Ethereum-style address (0x + 40 hex chars).
    /// In production, use Nethereum to generate real keypairs.
    /// For the testnet MVP, we generate deterministic-looking addresses.
    /// </summary>
    public static string GenerateAddress()
    {
        var bytes = RandomNumberGenerator.GetBytes(20);
        return "0x" + Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public static string GetNetworkForCurrency(Models.Currency currency)
    {
        return currency switch
        {
            Models.Currency.ETH => "ethereum-sepolia",
            Models.Currency.WBTC => "ethereum-sepolia",
            Models.Currency.USDT => "ethereum-sepolia",
            Models.Currency.BNB => "bsc-testnet",
            _ => "ethereum-sepolia"
        };
    }
}
