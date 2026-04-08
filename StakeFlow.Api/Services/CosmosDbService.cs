using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Cosmos.Linq;

namespace StakeFlow.Api.Services;

public class CosmosDbService
{
    private readonly CosmosClient _client;
    private readonly Database _database;
    private const string DatabaseName = "StakeFlowDb";

    public CosmosDbService(CosmosClient client)
    {
        _client = client;
        _database = _client.GetDatabase(DatabaseName);
    }

    public static async Task<CosmosDbService> CreateAsync(string connectionString)
    {
        var client = new CosmosClient(connectionString, new CosmosClientOptions
        {
            SerializerOptions = new CosmosSerializationOptions
            {
                PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase
            }
        });

        var database = await client.CreateDatabaseIfNotExistsAsync(DatabaseName);

        await database.Database.CreateContainerIfNotExistsAsync("users", "/partitionKey");
        await database.Database.CreateContainerIfNotExistsAsync("bets", "/partitionKey");
        await database.Database.CreateContainerIfNotExistsAsync("wallets", "/partitionKey");
        await database.Database.CreateContainerIfNotExistsAsync("transactions", "/partitionKey");

        return new CosmosDbService(client);
    }

    private Container GetContainer(string containerName) => _database.GetContainer(containerName);

    public async Task<T> CreateItemAsync<T>(string containerName, T item, string partitionKey)
    {
        var container = GetContainer(containerName);
        var response = await container.CreateItemAsync(item, new PartitionKey(partitionKey));
        return response.Resource;
    }

    public async Task<T?> GetItemAsync<T>(string containerName, string id, string partitionKey)
    {
        var container = GetContainer(containerName);
        try
        {
            var response = await container.ReadItemAsync<T>(id, new PartitionKey(partitionKey));
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return default;
        }
    }

    public async Task<T> UpsertItemAsync<T>(string containerName, T item, string partitionKey)
    {
        var container = GetContainer(containerName);
        var response = await container.UpsertItemAsync(item, new PartitionKey(partitionKey));
        return response.Resource;
    }

    public async Task DeleteItemAsync(string containerName, string id, string partitionKey)
    {
        var container = GetContainer(containerName);
        await container.DeleteItemAsync<object>(id, new PartitionKey(partitionKey));
    }

    public async Task<List<T>> QueryItemsAsync<T>(string containerName, string query, string? partitionKey = null)
    {
        var container = GetContainer(containerName);
        var queryDefinition = new QueryDefinition(query);

        QueryRequestOptions? options = null;
        if (partitionKey != null)
        {
            options = new QueryRequestOptions { PartitionKey = new PartitionKey(partitionKey) };
        }

        var iterator = container.GetItemQueryIterator<T>(queryDefinition, requestOptions: options);
        var results = new List<T>();

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync();
            results.AddRange(response);
        }

        return results;
    }

    public async Task<List<T>> QueryItemsByCrossPartitionAsync<T>(string containerName, string query)
    {
        var container = GetContainer(containerName);
        var queryDefinition = new QueryDefinition(query);

        var iterator = container.GetItemQueryIterator<T>(queryDefinition);
        var results = new List<T>();

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync();
            results.AddRange(response);
        }

        return results;
    }
}
