using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using StakeFlow.Api.Models.Dto;
using StakeFlow.Api.Services;

namespace StakeFlow.Api.Functions;

public class WalletFunctions
{
    private readonly WalletService _walletService;
    private readonly AuthService _authService;

    public WalletFunctions(WalletService walletService, AuthService authService)
    {
        _walletService = walletService;
        _authService = authService;
    }

    [Function("GetWallets")]
    public async Task<IActionResult> GetWallets(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "wallets")] HttpRequest req)
    {
        try
        {
            var userId = GetUserId(req);
            if (userId == null)
                return new UnauthorizedObjectResult(ApiResponse<object>.Fail("Unauthorized."));

            var wallets = await _walletService.GetWalletsAsync(userId);
            return new OkObjectResult(ApiResponse<List<WalletDto>>.Ok(wallets));
        }
        catch (Exception ex)
        {
            return new ObjectResult(ApiResponse<object>.Fail(ex.Message)) { StatusCode = 500 };
        }
    }

    [Function("Deposit")]
    public async Task<IActionResult> Deposit(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "wallets/deposit")] HttpRequest req)
    {
        try
        {
            var userId = GetUserId(req);
            if (userId == null)
                return new UnauthorizedObjectResult(ApiResponse<object>.Fail("Unauthorized."));

            var request = await req.ReadFromJsonAsync<DepositRequest>();
            if (request == null)
                return new BadRequestObjectResult(ApiResponse<object>.Fail("Invalid request body."));

            var wallet = await _walletService.DepositAsync(userId, request);
            return new OkObjectResult(ApiResponse<WalletDto>.Ok(wallet));
        }
        catch (ArgumentException ex)
        {
            return new BadRequestObjectResult(ApiResponse<object>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            return new ObjectResult(ApiResponse<object>.Fail(ex.Message)) { StatusCode = 500 };
        }
    }

    [Function("Withdraw")]
    public async Task<IActionResult> Withdraw(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "wallets/withdraw")] HttpRequest req)
    {
        try
        {
            var userId = GetUserId(req);
            if (userId == null)
                return new UnauthorizedObjectResult(ApiResponse<object>.Fail("Unauthorized."));

            var request = await req.ReadFromJsonAsync<WithdrawRequest>();
            if (request == null)
                return new BadRequestObjectResult(ApiResponse<object>.Fail("Invalid request body."));

            var wallet = await _walletService.WithdrawAsync(userId, request);
            return new OkObjectResult(ApiResponse<WalletDto>.Ok(wallet));
        }
        catch (ArgumentException ex)
        {
            return new BadRequestObjectResult(ApiResponse<object>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return new BadRequestObjectResult(ApiResponse<object>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            return new ObjectResult(ApiResponse<object>.Fail(ex.Message)) { StatusCode = 500 };
        }
    }

    [Function("GetTransactions")]
    public async Task<IActionResult> GetTransactions(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "wallets/transactions")] HttpRequest req)
    {
        try
        {
            var userId = GetUserId(req);
            if (userId == null)
                return new UnauthorizedObjectResult(ApiResponse<object>.Fail("Unauthorized."));

            var txs = await _walletService.GetTransactionsAsync(userId);
            return new OkObjectResult(ApiResponse<List<TransactionDto>>.Ok(txs));
        }
        catch (Exception ex)
        {
            return new ObjectResult(ApiResponse<object>.Fail(ex.Message)) { StatusCode = 500 };
        }
    }

    private string? GetUserId(HttpRequest req)
    {
        var authHeader = req.Headers["Authorization"].FirstOrDefault();
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            return null;

        var token = authHeader.Substring("Bearer ".Length);
        var principal = _authService.ValidateToken(token);
        return principal == null ? null : AuthService.GetUserIdFromPrincipal(principal);
    }
}
