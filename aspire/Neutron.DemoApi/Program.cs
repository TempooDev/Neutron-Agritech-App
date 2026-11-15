using System.Text.Json;
using Neutron.DemoApi.Simulation;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.Services.Configure<ImpactOptions>(builder.Configuration.GetSection("Impact"));
builder.Services.AddSingleton<FarmSimulator>();
builder.Services.AddHostedService<SimulationWorker>();
builder.Services.ConfigureHttpJsonOptions(o => o.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase);
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

app.UseCors();
app.MapDefaultEndpoints();

var api = app.MapGroup("/api");

api.MapGet("/", () => Results.Ok(new { name = "Neutron Demo API", cooperative = FarmSeed.Cooperative }));

// Estado completo de la finca (parcelas, alertas, dispositivos, impacto, eventos).
api.MapGet("/snapshot", (FarmSimulator sim) => sim.GetSnapshot());

// Flujo en vivo con Server-Sent Events: un snapshot por segundo.
api.MapGet("/stream", async (HttpContext ctx, FarmSimulator sim, CancellationToken ct) =>
{
    ctx.Response.Headers.ContentType = "text/event-stream";
    ctx.Response.Headers.CacheControl = "no-cache";
    ctx.Response.Headers["X-Accel-Buffering"] = "no";
    var json = ctx.RequestServices.GetRequiredService<Microsoft.Extensions.Options.IOptions<Microsoft.AspNetCore.Http.Json.JsonOptions>>().Value.SerializerOptions;

    long lastVersion = -1;
    try
    {
        while (!ct.IsCancellationRequested)
        {
            if (sim.Version != lastVersion)
            {
                lastVersion = sim.Version;
                var payload = JsonSerializer.Serialize(sim.GetSnapshot(), json);
                await ctx.Response.WriteAsync($"event: snapshot\ndata: {payload}\n\n", ct);
                await ctx.Response.Body.FlushAsync(ct);
            }
            await Task.Delay(250, ct);
        }
    }
    catch (OperationCanceledException)
    {
        // El navegador cerró la conexión.
    }
});

api.MapGet("/plots/{id}/history", (string id, int? hours, FarmSimulator sim) =>
    sim.GetHistory(id, hours ?? 24 * 7) is { } history ? Results.Ok(history) : Results.NotFound());

api.MapPost("/plots/{id}/irrigate", (string id, IrrigateRequest req, FarmSimulator sim) =>
    sim.Irrigate(id, req.Minutes) ? Results.Accepted() : Results.NotFound());

api.MapPost("/alerts/{id}/resolve", (string id, ResolveRequest req, FarmSimulator sim) =>
    sim.ResolveAlert(id, req.Status, req.Reason) ? Results.Ok() : Results.NotFound());

// Control de la demo (panel del presentador).
api.MapGet("/demo/scenarios", () => FarmSimulator.ListScenarios());
api.MapPost("/demo/scenarios/{id}", (string id, FarmSimulator sim) =>
    sim.StartScenario(id) ? Results.Ok(sim.GetSnapshot()) : Results.NotFound());
api.MapPost("/demo/reset", (FarmSimulator sim) =>
{
    sim.Reset();
    return Results.Ok(sim.GetSnapshot());
});
api.MapPost("/demo/speed", (SpeedRequest req, FarmSimulator sim) =>
{
    sim.SetSpeed(req.Speed);
    return Results.Ok();
});
api.MapPost("/demo/pause", (FarmSimulator sim) => { sim.SetPaused(true); return Results.Ok(); });
api.MapPost("/demo/resume", (FarmSimulator sim) => { sim.SetPaused(false); return Results.Ok(); });

api.MapGet("/impact", (FarmSimulator sim) => sim.GetSnapshot().Impact);

app.Run();
