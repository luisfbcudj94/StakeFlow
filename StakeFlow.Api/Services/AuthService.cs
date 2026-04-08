using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using StakeFlow.Api.Models;
using StakeFlow.Api.Models.Dto;

namespace StakeFlow.Api.Services;

public class AuthService
{
    private readonly CosmosDbService _db;
    private readonly string _jwtSecret;
    private readonly string _jwtIssuer;

    public AuthService(CosmosDbService db, string jwtSecret, string jwtIssuer = "StakeFlow")
    {
        _db = db;
        _jwtSecret = jwtSecret;
        _jwtIssuer = jwtIssuer;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        // Check if email already exists
        var existing = await _db.QueryItemsByCrossPartitionAsync<User>(
            "users",
            $"SELECT * FROM c WHERE c.email = '{request.Email.Replace("'", "''")}'");

        if (existing.Any())
            throw new InvalidOperationException("Email already registered.");

        var user = new User
        {
            Email = request.Email.ToLowerInvariant().Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            DisplayName = request.DisplayName.Trim(),
            EthAddress = CryptoService.GenerateAddress(),
            BscAddress = CryptoService.GenerateAddress()
        };

        await _db.CreateItemAsync("users", user, user.PartitionKey);

        // Create wallets for the user
        var walletService = new WalletService(_db);
        await walletService.CreateWalletsForUserAsync(user);

        var token = GenerateJwt(user);
        return new AuthResponse
        {
            Token = token,
            User = MapUserDto(user)
        };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var users = await _db.QueryItemsByCrossPartitionAsync<User>(
            "users",
            $"SELECT * FROM c WHERE c.email = '{request.Email.ToLowerInvariant().Trim().Replace("'", "''")}'");

        var user = users.FirstOrDefault()
            ?? throw new UnauthorizedAccessException("Invalid email or password.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        var token = GenerateJwt(user);
        return new AuthResponse
        {
            Token = token,
            User = MapUserDto(user)
        };
    }

    public async Task<UserDto?> GetUserByIdAsync(string userId)
    {
        var user = await _db.GetItemAsync<User>("users", userId, userId);
        return user == null ? null : MapUserDto(user);
    }

    public string GenerateJwt(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.DisplayName)
        };

        var token = new JwtSecurityToken(
            issuer: _jwtIssuer,
            audience: _jwtIssuer,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_jwtSecret);

        try
        {
            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _jwtIssuer,
                ValidateAudience = true,
                ValidAudience = _jwtIssuer,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out _);

            return principal;
        }
        catch
        {
            return null;
        }
    }

    public static string? GetUserIdFromPrincipal(ClaimsPrincipal principal)
    {
        return principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }

    private static UserDto MapUserDto(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        DisplayName = user.DisplayName,
        EthAddress = user.EthAddress,
        BscAddress = user.BscAddress
    };
}
