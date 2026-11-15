namespace Neutron.DemoApi.Simulation;

/// <summary>Hace avanzar la simulación una vez por segundo (tiempo real).</summary>
public sealed class SimulationWorker(FarmSimulator simulator, ILogger<SimulationWorker> logger) : BackgroundService
{
    public static readonly TimeSpan Tick = TimeSpan.FromSeconds(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Simulador de sensores en marcha (tick {Tick})", Tick);
        using var timer = new PeriodicTimer(Tick);
        var last = DateTimeOffset.UtcNow;
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            var now = DateTimeOffset.UtcNow;
            try
            {
                simulator.Advance(now - last);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error avanzando la simulación");
            }
            last = now;
        }
    }
}
