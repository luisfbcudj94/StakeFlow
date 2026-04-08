using System.Text.Json.Serialization;

namespace StakeFlow.Api.Models;

public enum TransactionType
{
    Deposit,
    Withdraw,
    BetStake,
    BetPayout,
    HouseFee,
    Penalty,
    Refund
}

public enum TransactionStatus
{
    Pending,
    Completed,
    Failed
}

public class Transaction
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public TransactionType Type { get; set; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    [JsonPropertyName("currency")]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public Currency Currency { get; set; }

    [JsonPropertyName("betId")]
    public string? BetId { get; set; }

    [JsonPropertyName("txHash")]
    public string? TxHash { get; set; }

    [JsonPropertyName("status")]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public TransactionStatus Status { get; set; } = TransactionStatus.Completed;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("partitionKey")]
    public string PartitionKey => UserId;
}
