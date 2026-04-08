using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using StakeFlow.Api.Services;

var builder = FunctionsApplication.CreateBuilder(args);

builder.ConfigureFunctionsWebApplication();

// Cosmos DB
var cosmosConnectionString = Environment.GetEnvironmentVariable("CosmosDbConnectionString")
    ?? "AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";
var cosmosDb = CosmosDbService.CreateAsync(cosmosConnectionString).GetAwaiter().GetResult();
builder.Services.AddSingleton(cosmosDb);

// JWT Secret
var jwtSecret = Environment.GetEnvironmentVariable("JwtSecret") ?? "StakeFlow-Super-Secret-Key-Change-In-Production-2026!";
builder.Services.AddSingleton(sp => new AuthService(sp.GetRequiredService<CosmosDbService>(), jwtSecret));
builder.Services.AddSingleton<WalletService>();
builder.Services.AddSingleton<BetService>();
builder.Services.AddSingleton<BetResolutionService>();

builder.Services
    .AddApplicationInsightsTelemetryWorkerService()
    .ConfigureFunctionsApplicationInsights();

builder.Build().Run();
