using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using StakeFlow.Api.Services;

namespace StakeFlow.Api.Functions;

public class TimerFunctions
{
    private readonly BetResolutionService _resolutionService;
    private readonly ILogger<TimerFunctions> _logger;

    public TimerFunctions(BetResolutionService resolutionService, ILogger<TimerFunctions> logger)
    {
        _resolutionService = resolutionService;
        _logger = logger;
    }

    /// <summary>
    /// Runs every 5 minutes to expire open bets past their expiration date.
    /// </summary>
    [Function("ExpireOpenBets")]
    public async Task ExpireOpenBets(
        [TimerTrigger("0 */5 * * * *")] TimerInfo timerInfo)
    {
        _logger.LogInformation("ExpireOpenBets timer triggered at {Time}", DateTime.UtcNow);
        try
        {
            await _resolutionService.ExpireOpenBetsAsync();
            _logger.LogInformation("ExpireOpenBets completed.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in ExpireOpenBets.");
        }
    }

    /// <summary>
    /// Runs every 10 minutes to resolve bets stuck in PendingResolution past the 48h deadline.
    /// </summary>
    [Function("ResolveTimedOutBets")]
    public async Task ResolveTimedOutBets(
        [TimerTrigger("0 */10 * * * *")] TimerInfo timerInfo)
    {
        _logger.LogInformation("ResolveTimedOutBets timer triggered at {Time}", DateTime.UtcNow);
        try
        {
            await _resolutionService.ResolveTimedOutBetsAsync();
            _logger.LogInformation("ResolveTimedOutBets completed.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in ResolveTimedOutBets.");
        }
    }
}
