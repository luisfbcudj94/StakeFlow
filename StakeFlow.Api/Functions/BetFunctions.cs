using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using StakeFlow.Api.Models.Dto;
using StakeFlow.Api.Services;

namespace StakeFlow.Api.Functions;

public class BetFunctions
{
    private readonly BetService _betService;
    private readonly BetResolutionService _resolutionService;
    private readonly AuthService _authService;

    public BetFunctions(BetService betService, BetResolutionService resolutionService, AuthService authService)
    {
        _betService = betService;
        _resolutionService = resolutionService;
        _authService = authService;
    }

    [Function("CreateBet")]
    public async Task<IActionResult> CreateBet(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "bets")] HttpRequest req)
    {
        try
        {
            var userId = GetUserId(req);
            if (userId == null)
                return new UnauthorizedObjectResult(ApiResponse<object>.Fail("Unauthorized."));

            var request = await req.ReadFromJsonAsync<CreateBetRequest>();
            if (request == null)
                return new BadRequestObjectResult(ApiResponse<object>.Fail("Invalid request body."));

            var bet = await _betService.CreateBetAsync(userId, request);
            return new OkObjectResult(ApiResponse<BetDto>.Ok(bet));
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

    [Function("GetOpenBets")]
    public async Task<IActionResult> GetOpenBets(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "bets")] HttpRequest req)
    {
        try
        {
            var currency = req.Query["currency"].FirstOrDefault();
            var bets = await _betService.GetOpenBetsAsync(currencyFilter: currency);
            return new OkObjectResult(ApiResponse<List<BetDto>>.Ok(bets));
        }
        catch (Exception ex)
        {
            return new ObjectResult(ApiResponse<object>.Fail(ex.Message)) { StatusCode = 500 };
        }
    }

    [Function("GetBetById")]
    public async Task<IActionResult> GetBetById(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "bets/{betId}")] HttpRequest req,
        string betId)
    {
        try
        {
            var bet = await _betService.GetBetByIdAsync(betId);
            if (bet == null)
                return new NotFoundObjectResult(ApiResponse<object>.Fail("Bet not found."));

            return new OkObjectResult(ApiResponse<BetDto>.Ok(bet));
        }
        catch (Exception ex)
        {
            return new ObjectResult(ApiResponse<object>.Fail(ex.Message)) { StatusCode = 500 };
        }
    }

    [Function("GetMyBets")]
    public async Task<IActionResult> GetMyBets(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "bets/my")] HttpRequest req)
    {
        try
        {
            var userId = GetUserId(req);
            if (userId == null)
                return new UnauthorizedObjectResult(ApiResponse<object>.Fail("Unauthorized."));

            var bets = await _betService.GetMyBetsAsync(userId);
            return new OkObjectResult(ApiResponse<List<BetDto>>.Ok(bets));
        }
        catch (Exception ex)
        {
            return new ObjectResult(ApiResponse<object>.Fail(ex.Message)) { StatusCode = 500 };
        }
    }

    [Function("JoinBet")]
    public async Task<IActionResult> JoinBet(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "bets/{betId}/join")] HttpRequest req,
        string betId)
    {
        try
        {
            var userId = GetUserId(req);
            if (userId == null)
                return new UnauthorizedObjectResult(ApiResponse<object>.Fail("Unauthorized."));

            var request = await req.ReadFromJsonAsync<JoinBetRequest>();
            if (request == null)
                return new BadRequestObjectResult(ApiResponse<object>.Fail("Invalid request body."));

            var bet = await _betService.JoinBetAsync(userId, betId, request);
            return new OkObjectResult(ApiResponse<BetDto>.Ok(bet));
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

    [Function("ResolveBet")]
    public async Task<IActionResult> ResolveBet(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "bets/{betId}/resolve")] HttpRequest req,
        string betId)
    {
        try
        {
            var userId = GetUserId(req);
            if (userId == null)
                return new UnauthorizedObjectResult(ApiResponse<object>.Fail("Unauthorized."));

            var request = await req.ReadFromJsonAsync<ResolveBetRequest>();
            if (request == null)
                return new BadRequestObjectResult(ApiResponse<object>.Fail("Invalid request body."));

            var bet = await _resolutionService.ReportResultAsync(userId, betId, request.WinningSide);
            return new OkObjectResult(ApiResponse<BetDto>.Ok(BetService.MapBetDto(bet)));
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
