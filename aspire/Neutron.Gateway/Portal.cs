// Portada del gateway con acceso a cada aplicación de la demo.
static class Portal
{
    public static string Html(string dashboardUrl) => $$"""
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Neutron · Demo</title>
<link rel="icon" href="/favicon.svg" />
<style>
  :root { --forest: #123321; --green: #2c9354; --ink: #17251d; --muted: #69766e; --line: #dfe5df; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--ink);
         background: radial-gradient(circle at 15% 0%, #1d5a37 0, var(--forest) 45%, #0d2418 100%); min-height: 100vh; }
  main { max-width: 980px; margin: 0 auto; padding: 56px 20px; }
  header { color: #fff; display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
  header img { width: 44px; height: 44px; }
  h1 { margin: 0; font-size: 30px; letter-spacing: -0.02em; }
  .lead { color: #cfe5d5; margin: 0 0 32px; max-width: 640px; line-height: 1.5; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
  a.card { display: flex; flex-direction: column; gap: 8px; background: #fff; border-radius: 16px; padding: 22px; text-decoration: none;
           color: var(--ink); border: 1px solid var(--line); transition: transform .15s ease, box-shadow .15s ease; }
  a.card:hover { transform: translateY(-2px); box-shadow: 0 16px 45px rgba(0,0,0,.25); }
  .tag { align-self: flex-start; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
         color: var(--green); background: #edf8f0; border-radius: 999px; padding: 4px 10px; }
  .card strong { font-size: 18px; }
  .card span.desc { color: var(--muted); font-size: 14px; line-height: 1.45; }
  .card code { font-size: 12px; color: var(--muted); }
  a.card.iot { background: #0d2418; color: #fff; border-color: #2c9354; }
  a.card.iot .desc, a.card.iot code { color: #cfe5d5; }
  a.card.iot .tag { background: #2c9354; color: #fff; }
  footer { color: #9fbfab; font-size: 13px; margin-top: 28px; }
</style>
</head>
<body>
<main>
  <header><img src="/logo-neutron.svg" alt="" /><h1>Neutron · Demo en vivo</h1></header>
  <p class="lead">Cooperativa Valle Verde · 22,2 ha de aguacate y pitaya con sensores simulados en tiempo real.
     Lanza escenarios desde el botón «Demo» de cualquier app.</p>
  <div class="grid">
    <a class="card" href="/campo"><span class="tag">APP-02</span><strong>App de campo</strong>
      <span class="desc">Móvil para agricultores: estado de parcelas, alertas y actuaciones, también sin cobertura.</span><code>/campo</code></a>
    <a class="card" href="/panel"><span class="tag">APP-01</span><strong>Panel de control</strong>
      <span class="desc">Gemelo digital, dispositivos IoT, reglas, modelos e informes para el equipo técnico.</span><code>/panel</code></a>
    <a class="card" href="/backoffice"><span class="tag">Back-office</span><strong>Back-office Neutron</strong>
      <span class="desc">CRM, facturación, compras, inventario de dispositivos y soporte.</span><code>/backoffice</code></a>
    <a class="card iot" href="/dashboard"><span class="tag">IoT</span><strong>Telemetría (Aspire)</strong>
      <span class="desc">Dashboard con las métricas de los sensores, trazas y logs del simulador y del motor de reglas.</span><code>/dashboard</code></a>
    <a class="card" href="/api/snapshot"><span class="tag">API</span><strong>API de la finca</strong>
      <span class="desc">Estado completo en JSON: parcelas, alertas, dispositivos e impacto.</span><code>/api/snapshot</code></a>
  </div>
</main>
</body>
</html>
""";
}
