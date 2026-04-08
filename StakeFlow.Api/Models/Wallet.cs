using System.Text.Json.Serialization;

namespace StakeFlow.Api.Models;

public enum Currency
{
    ETH,
    WBTC,
    USDT,
    BNB
}

public class Wallet
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("currency")]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public Currency Currency { get; set; }

    [JsonPropertyName("balance")]
    public decimal Balance { get; set; }

    [JsonPropertyName("frozenBalance")]
    public decimal FrozenBalance { get; set; }

    [JsonPropertyName("network")]
    public string Network { get; set; } = string.Empty; // "ethereum-sepolia" or "bsc-testnet"

    [JsonPropertyName("depositAddress")]
    public string DepositAddress { get; set; } = string.Empty;

    [JsonPropertyName("partitionKey")]
    public string PartitionKey => UserId;
}
