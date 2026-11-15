var builder = DistributedApplication.CreateBuilder(args);

// API de demo: finca semilla, simulador de sensores, motor de reglas,
// escenarios guionados y cálculo de impacto.
var api = builder.AddProject<Projects.Neutron_DemoApi>("neutron-api")
    .WithHttpHealthCheck("/health");

// Frontend React + Vite que ya existía en la raíz del repo (apps /campo, /panel y /backoffice).
// Si se abre directamente, Vite hace de proxy de /api hacia la API (ver vite.config.ts).
var web = builder.AddViteApp("neutron-web", "../..")
    .WithPnpm()
    .WithReference(api)
    .WaitFor(api)
    .WithEnvironment("NEUTRON_API_URL", api.GetEndpoint("http"));

// Gateway: punto de entrada único en http://localhost:8080
//   /  portal · /campo /panel /backoffice  apps · /api  API · /dashboard  Aspire
var dashboardUrl = builder.Configuration["ASPNETCORE_URLS"] ?? "http://localhost:15180";
builder.AddProject<Projects.Neutron_Gateway>("gateway")
    .WithReference(api)
    .WithReference(web)
    .WaitFor(web)
    .WithEnvironment("DASHBOARD_URL", dashboardUrl)
    .WithExternalHttpEndpoints();

builder.Build().Run();
