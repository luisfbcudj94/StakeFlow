using System.Text.Json.Serialization;

namespace StakeFlow.Api.Models;

public class User
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("passwordHash")]
    public string PasswordHash { get; set; } = string.Empty;

    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; } = string.Empty;

    [JsonPropertyName("ethAddress")]
    public string EthAddress { get; set; } = string.Empty;

    [JsonPropertyName("bscAddress")]
    public string BscAddress { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("partitionKey")]
    public string PartitionKey => Id;
}
