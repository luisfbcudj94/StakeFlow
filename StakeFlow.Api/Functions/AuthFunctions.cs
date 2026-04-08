using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using StakeFlow.Api.Models.Dto;
using StakeFlow.Api.Services;

namespace StakeFlow.Api.Functions;

public class AuthFunctions
{
    private readonly AuthService _authService;

    public AuthFunctions(AuthService authService)
    {
        _authService = authService;
    }

    [Function("Register")]
    public async Task<IActionResult> Register(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/register")] HttpRequest req)
    {
        try
        {
            var request = await req.ReadFromJsonAsync<RegisterRequest>();
            if (request == null)
                return new BadRequestObjectResult(ApiResponse<object>.Fail("Invalid request body."));

            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return new BadRequestObjectResult(ApiResponse<object>.Fail("Email and password are required."));

            if (request.Password.Length < 6)
                return new BadRequestObjectResult(ApiResponse<object>.Fail("Password must be at least 6 characters."));

            var result = await _authService.RegisterAsync(request);
            return new OkObjectResult(ApiResponse<AuthResponse>.Ok(result));
        }
        catch (InvalidOperationException ex)
        {
            return new ConflictObjectResult(ApiResponse<object>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            return new ObjectResult(ApiResponse<object>.Fail(ex.Message)) { StatusCode = 500 };
        }
    }

    [Function("Login")]
    public async Task<IActionResult> Login(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/login")] HttpRequest req)
    {
        try
        {
            var request = await req.ReadFromJsonAsync<LoginRequest>();
            if (request == null)
                return new BadRequestObjectResult(ApiResponse<object>.Fail("Invalid request body."));

            var result = await _authService.LoginAsync(request);
            return new OkObjectResult(ApiResponse<AuthResponse>.Ok(result));
        }
        catch (UnauthorizedAccessException ex)
        {
            return new UnauthorizedObjectResult(ApiResponse<object>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            return new ObjectResult(ApiResponse<object>.Fail(ex.Message)) { StatusCode = 500 };
        }
    }

    [Function("GetMe")]
    public async Task<IActionResult> GetMe(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "auth/me")] HttpRequest req)
    {
        try
        {
            var userId = GetUserId(req);
            if (userId == null)
                return new UnauthorizedObjectResult(ApiResponse<object>.Fail("Unauthorized."));

            var user = await _authService.GetUserByIdAsync(userId);
            if (user == null)
                return new NotFoundObjectResult(ApiResponse<object>.Fail("User not found."));

            return new OkObjectResult(ApiResponse<UserDto>.Ok(user));
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
