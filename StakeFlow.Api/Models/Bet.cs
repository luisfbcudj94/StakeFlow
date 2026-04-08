using System.Text.Json.Serialization;

namespace StakeFlow.Api.Models;

public enum BetStatus
{
    Open,
    Matched,
    PendingResolution,
    Resolved,
    Disputed,
    Cancelled
}

public class BetParticipant
{
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; } = string.Empty;

    [JsonPropertyName("chosenOption")]
    public string ChosenOption { get; set; } = string.Empty; // "A" or "B"

    [JsonPropertyName("reportedWinner")]
    public string? ReportedWinner { get; set; } // "A" or "B" or null

    [JsonPropertyName("reportedAt")]
    public DateTime? ReportedAt { get; set; }
}

public class Bet
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("creatorId")]
    public string CreatorId { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("optionA")]
    public string OptionA { get; set; } = string.Empty;

    [JsonPropertyName("optionB")]
    public string OptionB { get; set; } = string.Empty;

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    [JsonPropertyName("currency")]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public Currency Currency { get; set; }

    [JsonPropertyName("status")]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public BetStatus Status { get; set; } = BetStatus.Open;

    [JsonPropertyName("participants")]
    public List<BetParticipant> Participants { get; set; } = new();

    [JsonPropertyName("winningSide")]
    public string? WinningSide { get; set; } // "A" or "B" after resolution

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("expiresAt")]
    public DateTime ExpiresAt { get; set; }

    [JsonPropertyName("matchedAt")]
    public DateTime? MatchedAt { get; set; }

    [JsonPropertyName("resolvedAt")]
    public DateTime? ResolvedAt { get; set; }

    [JsonPropertyName("resolutionDeadline")]
    public DateTime? ResolutionDeadline { get; set; }

    [JsonPropertyName("partitionKey")]
    public string PartitionKey => Status.ToString();
}
