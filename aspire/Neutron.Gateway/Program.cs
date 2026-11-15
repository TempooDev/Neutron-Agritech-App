// Gateway de la demo: un único punto de entrada (http://localhost:8080).
//   /             portal con enlaces a todas las apps
//   /campo, /panel, /backoffice   apps del frontend (Vite)
//   /api/...      API de demo (simulador IoT, reglas, escenarios, impacto)
//   /dashboard    dashboard de Aspire, solo al arrancar con Aspire (DASHBOARD_URL)
var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"))
    .AddServiceDiscoveryDestinationResolver();

var app = builder.Build();

app.MapDefaultEndpoints();

// Solo con Aspire: el AppHost pasa DASHBOARD_URL. En Docker Compose no hay dashboard.
var dashboardUrl = builder.Configuration["DASHBOARD_URL"]?
    .Split(';', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()?.TrimEnd('/');

if (dashboardUrl is not null)
{
    // El dashboard de Aspire no admite servirse bajo una subruta, así que redirigimos.
    app.MapGet("/dashboard", () => Results.Redirect(dashboardUrl));
    app.MapGet("/dashboard/{**rest}", (string? rest) => Results.Redirect($"{dashboardUrl}/{rest}"));
}

// Portada en "/". Las conexiones WebSocket a "/" (recarga en caliente de Vite) siguen hacia la web.
app.Use(async (context, next) =>
{
    if (context.Request.Path == "/" && HttpMethods.IsGet(context.Request.Method)
        && !context.Request.Headers.Upgrade.Any(v => string.Equals(v, "websocket", StringComparison.OrdinalIgnoreCase)))
    {
        context.Response.ContentType = "text/html; charset=utf-8";
        await context.Response.WriteAsync(Portal.Html(dashboardUrl is not null));
        return;
    }
    await next();
});

app.MapReverseProxy();

app.Run();
