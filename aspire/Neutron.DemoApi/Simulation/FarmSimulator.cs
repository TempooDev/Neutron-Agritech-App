using System.Diagnostics;
using System.Diagnostics.Metrics;
using Microsoft.Extensions.Options;

namespace Neutron.DemoApi.Simulation;

/// <summary>
/// Gemelo digital simplificado de la finca: clima, balance hídrico del suelo, riego,
/// salud del cultivo, sensores y alertas. Todo es determinista a partir de una semilla
/// para que la demo se comporte igual cada vez que se reinicia.
/// </summary>
public sealed class FarmSimulator
{
    public static readonly ActivitySource ActivitySource = new("Neutron.Simulation");
    private static readonly Meter Meter = new("Neutron.Simulation");
    private static readonly Counter<long> AlertsCounter = Meter.CreateCounter<long>("neutron.alerts.raised");

    private const double StepHours = 5.0 / 60.0;          // paso de integración: 5 min simulados
    private const double HistoryEveryHours = 0.5;         // una muestra de historial cada 30 min
    private const int HistoryDays = 30;
    public const double MmToPct = 1.5;                    // 1 mm de agua ≈ 1,5 % vol en el bulbo húmedo que ve la sonda
    private const double FieldCapacity = 60;              // por encima drena

    private readonly object _gate = new();
    private readonly ImpactOptions _impact;
    private readonly ILogger<FarmSimulator> _logger;

    private Random _rng = new(42);
    private DateTimeOffset _simTime;
    private double _speed = 600;                           // 1 s real = 10 min simulados
    private bool _paused;
    private double _sinceHistory;
    private Scenario _scenario = Scenarios.Normal;
    private DateTimeOffset? _scenarioStartedAt;
    private Weather _weather = new();
    private readonly List<double> _rainLog = [];          // lluvia por paso, últimas 24 h
    private double _et0Today;
    private int _lastDay = -1;
    private double _dayTempOffset;
    private double _dayCloud = 1;

    private List<PlotState> _plots = [];
    private List<DeviceState> _devices = [];
    private readonly Dictionary<string, AlertState> _activeAlerts = [];
    private readonly List<AlertState> _archivedAlerts = [];
    private readonly LinkedList<EventDto> _events = new();
    private int _alertSeq;
    private string _runId = "";
    private int _alertsRaised;
    private int _alertsActedOn;
    private double _healthProtected;
    private DateTimeOffset _impactSince;

    public FarmSimulator(IOptions<ImpactOptions> impact, ILogger<FarmSimulator> logger)
    {
        _impact = impact.Value;
        _logger = logger;
        Reset();

        Meter.CreateObservableGauge("neutron.soil.moisture", () => Measure(p => p.Moisture), "%", "Humedad del suelo por parcela");
        Meter.CreateObservableGauge("neutron.plot.health", () => Measure(p => p.Health), "%", "Índice de salud por parcela");
        Meter.CreateObservableGauge("neutron.irrigation.flow", () => Measure(p => p.FlowM3h), "m3/h", "Caudal de riego por sector");
    }

    public long Version { get; private set; }

    private IEnumerable<Measurement<double>> Measure(Func<PlotState, double> selector)
    {
        lock (_gate)
        {
            return _plots.Select(p => new Measurement<double>(Math.Round(selector(p), 2),
                new KeyValuePair<string, object?>("plot", p.Seed.Name))).ToList();
        }
    }

    // ------------------------------------------------------------------ control

    public void Reset()
    {
        lock (_gate)
        {
            _rng = new Random(42);
            var now = DateTimeOffset.Now;
            // Arrancamos a las 10:00 de hoy para que haya luz y la demo tenga movimiento.
            _simTime = new DateTimeOffset(now.Year, now.Month, now.Day, 10, 0, 0, now.Offset);
            _scenario = Scenarios.Normal;
            _scenarioStartedAt = null;
            _activeAlerts.Clear();
            _archivedAlerts.Clear();
            _events.Clear();
            _rainLog.Clear();
            _alertSeq = 0;
            // Identificador de ejecución: evita que el navegador confunda alertas de una demo anterior.
            _runId = Guid.NewGuid().ToString("N")[..4];
            _alertsRaised = 0;
            _alertsActedOn = 0;
            _healthProtected = 0;
            _paused = false;

            _plots = FarmSeed.Plots.Select(s => new PlotState(s)).ToList();
            _devices = FarmSeed.Devices.Select(d => new DeviceState(d)).ToList();

            WarmUpHistory();

            // El impacto incluye los 30 días de historial: así el panel arranca con cifras estables.
            _impactSince = _simTime.AddDays(-HistoryDays);
            _devices = FarmSeed.Devices.Select(d => new DeviceState(d) { LastTx = _simTime.AddMinutes(-_rng.Next(1, 12)) }).ToList();

            AddEvent("demo", "Simulación iniciada · finca Valle Verde con 30 días de historial");
            EvaluateRules();
            Version++;
        }
    }

    public void SetSpeed(double speed)
    {
        lock (_gate)
        {
            _speed = Math.Clamp(speed, 1, 3600);
            AddEvent("demo", $"Velocidad de simulación ×{_speed:0}");
            Version++;
        }
    }

    public void SetPaused(bool paused)
    {
        lock (_gate)
        {
            _paused = paused;
            AddEvent("demo", paused ? "Simulación en pausa" : "Simulación reanudada");
            Version++;
        }
    }

    public bool StartScenario(string id)
    {
        var scenario = Scenarios.All.FirstOrDefault(s => s.Id == id);
        if (scenario is null) return false;

        using var activity = ActivitySource.StartActivity("scenario.start");
        activity?.SetTag("scenario", id);

        lock (_gate)
        {
            _scenario = scenario;
            _scenarioStartedAt = _simTime;
            foreach (var p in _plots)
            {
                p.LeakFault = false;
                p.RainPendingMm = 0;
            }

            switch (scenario.Id)
            {
                case "heatwave":
                    // Si es de noche avanzamos hasta media mañana para que el calor se note ya.
                    if (_simTime.Hour < 8 || _simTime.Hour > 16) FastForwardToHour(11);
                    break;
                case "pest":
                    foreach (var p in _plots.Where(p => p.Seed.Owner == "Finca El Manantial"))
                        p.RainPendingMm = p.Seed.Id == "p1" ? 26 : 12;
                    break;
                case "irrigation-failure":
                    var target = _plots.First(p => p.Seed.Id == "p2");
                    target.LeakFault = true;
                    StartIrrigation(target, 60, "Riego programado");
                    break;
            }

            AddEvent("scenario", $"Escenario «{scenario.Label}» iniciado");
            _logger.LogInformation("Escenario {Scenario} iniciado en tiempo simulado {SimTime}", scenario.Id, _simTime);
            Version++;
            return true;
        }
    }

    public bool Irrigate(string plotId, int minutes, string origin = "Orden manual")
    {
        lock (_gate)
        {
            var plot = _plots.FirstOrDefault(p => p.Seed.Id == plotId);
            if (plot is null) return false;
            StartIrrigation(plot, Math.Clamp(minutes, 5, 240), origin);
            Version++;
            return true;
        }
    }

    public bool ResolveAlert(string alertId, string status, string? reason)
    {
        lock (_gate)
        {
            var alert = _activeAlerts.Values.FirstOrDefault(a => a.Id == alertId)
                        ?? _archivedAlerts.FirstOrDefault(a => a.Id == alertId);
            if (alert is null || alert.Resolved) return false;
            alert.Resolved = true;
            alert.ResolvedStatus = status;

            var plot = _plots.First(p => p.Seed.Id == alert.PlotId);
            if (status == "accepted")
            {
                _alertsActedOn++;
                ApplyRecommendation(alert, plot);
                AddEvent("action", $"Recomendación aceptada · {alert.Title} ({plot.Seed.Name})");
            }
            else
            {
                AddEvent("action", $"Recomendación rechazada · {alert.Title}{(reason is null ? "" : $" · {reason}")}");
            }

            Version++;
            return true;
        }
    }

    // ------------------------------------------------------------------ bucle de simulación

    /// <summary>Avanza la simulación según el tiempo real transcurrido.</summary>
    public void Advance(TimeSpan real)
    {
        lock (_gate)
        {
            if (_paused) return;
            var simHours = real.TotalHours * _speed;
            var steps = Math.Max(1, (int)Math.Round(simHours / StepHours));
            for (var i = 0; i < steps; i++) Step(StepHours, recordHistory: true, evaluate: true);
            Version++;
        }
    }

    private void FastForwardToHour(int hour)
    {
        var guard = 0;
        while (_simTime.Hour != hour && guard++ < 24 * 12)
            Step(StepHours, recordHistory: true, evaluate: true);
    }

    private void WarmUpHistory()
    {
        // Simulamos 30 días hacia atrás con el clima normal para tener historial coherente.
        var start = _simTime.AddDays(-HistoryDays);
        var end = _simTime;
        _simTime = start;
        while (_simTime < end) Step(StepHours, recordHistory: true, evaluate: false);

        // Ajustamos suavemente el historial para que el estado actual coincida con la semilla
        // (p. ej. Loma Alta tiene que llegar a hoy en estrés hídrico, como en el resto del prototipo).
        foreach (var p in _plots)
        {
            var delta = p.Moisture - p.Seed.InitialMoisture;
            _logger.LogDebug("Calentamiento {Plot}: humedad final {Moisture:0.0} (desvío {Delta:0.0})", p.Seed.Name, p.Moisture, delta);
            var n = p.History.Count;
            for (var i = 0; i < n; i++)
            {
                var ramp = Math.Pow((double)i / Math.Max(1, n - 1), 1.6);
                var h = p.History[i];
                p.History[i] = h with { Moisture = Math.Round(Math.Clamp(h.Moisture - delta * ramp, 8, 80), 1) };
            }

            p.Moisture = p.Seed.InitialMoisture;
            p.MeasuredMoisture = p.Seed.InitialMoisture;
            p.NearLowHours = p.Moisture < p.Seed.LowThreshold + 4 ? 6 : 0;
            p.FlowAnomalyHours = 0;
            p.FlowM3h = 0;
            p.Health = p.Seed.InitialHealth;
            p.Growth = p.Seed.InitialGrowth;
            p.LowHours = p.Moisture < p.Seed.LowThreshold ? 6 : 0;
            p.WetHours = 0;
            p.PhytoRisk = 18;
            p.TrapsToday = 3;
            p.IrrigationRemainingH = 0;
        }
    }

    private void Step(double dt, bool recordHistory, bool evaluate)
    {
        _simTime = _simTime.AddHours(dt);
        var hour = _simTime.Hour + _simTime.Minute / 60.0;

        if (_simTime.DayOfYear != _lastDay)
        {
            _lastDay = _simTime.DayOfYear;
            _et0Today = 0;
            // Variabilidad diaria del tiempo: días más cálidos, más frescos o nublados.
            _dayTempOffset = Gauss(1.8);
            _dayCloud = _rng.NextDouble() < 0.2 ? 0.55 + _rng.NextDouble() * 0.3 : 1.0;
            foreach (var p in _plots) p.TrapsToday = _scenario.Id == "pest" && p.Seed.Crop == "Pitaya" ? p.TrapsToday * 0.6 : _rng.Next(1, 5);
        }

        UpdateWeather(hour);
        _et0Today += _weather.Et0PerHour * dt;

        foreach (var p in _plots)
        {
            // Riego programado del agricultor a las 06:00.
            if (Math.Abs(hour - 6) < dt / 2 && p.SuspendedUntil < _simTime)
                StartIrrigation(p, p.Seed.ProgrammedMinutes, "Riego programado", log: evaluate);

            StepPlot(p, dt);
        }

        foreach (var d in _devices) StepDevice(d, dt);

        _sinceHistory += dt;
        if (recordHistory && _sinceHistory >= HistoryEveryHours - 1e-9)
        {
            _sinceHistory = 0;
            var cutoff = _simTime.AddDays(-HistoryDays);
            foreach (var p in _plots)
            {
                p.History.Add(new HistoryPointDto(_simTime, Math.Round(p.MeasuredMoisture, 1), Math.Round(p.SoilTemp, 1),
                    Math.Round(_weather.AirTemp, 1), Math.Round(p.FlowM3h, 1), (int)Math.Round(p.Health)));
                while (p.History.Count > 0 && p.History[0].Time < cutoff) p.History.RemoveAt(0);
            }
        }

        if (evaluate) EvaluateRules();
    }

    private void UpdateWeather(double hour)
    {
        var s = _scenario;
        // Curva diaria: mínimo hacia las 05:00, máximo hacia las 15:00.
        var f = 0.5 * (1 + Math.Cos(Math.PI * (hour - 15) / 12));
        var tMin = 15 + s.TempOffset * 0.6 + _dayTempOffset * 0.5;
        var tMax = 29 + s.TempOffset + _dayTempOffset;
        var noise = Gauss(0.25);

        var raining = _plots.Any(p => p.RainPendingMm > 0);
        var cloud = raining ? 0.35 : s.Id == "pest" ? 0.75 : _dayCloud;

        _weather.AirTemp = tMin + (tMax - tMin) * f + noise;
        _weather.Humidity = Math.Clamp(78 - 38 * f + s.HumidityOffset + (raining ? 18 : 0) + Gauss(1), 8, 99);
        _weather.Wind = Math.Max(0, 7 + 7 * f + s.WindOffset + Gauss(1.2));
        _weather.Radiation = Math.Max(0, Math.Sin(Math.PI * (hour - 6.5) / 13.5)) * 860 * cloud;

        // ET0 horaria aproximada (mm/h) a partir de radiación, temperatura, humedad y viento.
        var factor = (1 + 0.03 * (_weather.AirTemp - 20)) * (1 + (55 - _weather.Humidity) / 140) * (1 + _weather.Wind / 80);
        _weather.Et0PerHour = Math.Max(0, 0.00042 * _weather.Radiation * factor);
    }

    private void StepPlot(PlotState p, double dt)
    {
        var s = p.Seed;

        // Lluvia (escenario de plaga): cae repartida en unas 3 h.
        var rain = 0.0;
        if (p.RainPendingMm > 0)
        {
            rain = Math.Min(p.RainPendingMm, 11 * dt);
            p.RainPendingMm -= rain;
        }
        if (p == _plots[0]) _rainLog.Add(rain);
        if (p == _plots[0] && _rainLog.Count > 24 * 12) _rainLog.RemoveAt(0);

        // Evapotranspiración del cultivo con reducción si el suelo está muy seco.
        var dryness = Math.Clamp((p.Moisture - 12) / (s.LowThreshold - 12), 0.3, 1);
        var etc = _weather.Et0PerHour * s.Kc * dryness * dt;

        // Riego.
        var delivered = 0.0;
        if (p.IrrigationRemainingH > 0)
        {
            var h = Math.Min(dt, p.IrrigationRemainingH);
            p.IrrigationRemainingH -= h;
            var flow = s.NominalFlowM3h * (p.LeakFault ? 1.65 : 1.0);
            var effective = s.NominalFlowM3h * (p.LeakFault ? 0.2 : 1.0);
            p.FlowM3h = flow * (h / dt) * (1 + Gauss(0.015));
            p.WaterAppliedM3 += flow * h;
            delivered = effective * h / (s.AreaHa * 10); // m³ → mm sobre la parcela
        }
        else if (p.LeakFault)
        {
            // Con la tubería rota sigue saliendo agua aunque la válvula esté cerrada.
            var leak = s.NominalFlowM3h * 0.22;
            p.FlowM3h = leak * (1 + Gauss(0.03));
            p.WaterAppliedM3 += leak * dt;
        }
        else
        {
            p.FlowM3h = 0;
        }

        // Programa fijo tradicional (línea base para el ahorro de agua).
        p.WaterBaselineM3 += etc * s.AreaHa * 10 * _impact.TraditionalOverIrrigationFactor;

        p.Moisture += (delivered + rain * 0.6 - etc) * MmToPct;
        if (p.Moisture > FieldCapacity) p.Moisture -= (p.Moisture - FieldCapacity) * 0.04 * dt;
        p.Moisture = Math.Clamp(p.Moisture, 8, 82);
        p.MeasuredMoisture = p.Moisture + Gauss(0.2);

        // Temperatura de suelo a 30 cm: sigue al aire con retraso.
        var soilTarget = 0.55 * (_weather.AirTemp) + 0.45 * 21 + (p.Moisture > 55 ? -1 : 0);
        p.SoilTemp += (soilTarget - p.SoilTemp) * Math.Min(1, dt / 5);

        // Riesgo de Phytophthora (solo aguacate): suelo encharcado + suelo templado.
        if (s.Crop == "Aguacate")
        {
            var wet = p.Moisture > s.HighThreshold - 8 && p.SoilTemp > 16 && !p.Treated;
            p.WetHours = wet ? p.WetHours + dt : Math.Max(0, p.WetHours - dt * (p.Treated ? 2 : 0.4));
            p.PhytoRisk = Math.Clamp(18 + p.WetHours * 10, 5, 96);
        }

        // Capturas de trips (pitaya): suben con calor y en el escenario de plaga.
        if (s.Crop == "Pitaya")
        {
            var pressure = _scenario.Id == "pest" && s.Id == "p4" && !p.Treated ? 4.5 : 0.08;
            if (p.Treated) p.TrapsToday = Math.Max(1, p.TrapsToday - 4 * dt);
            else p.TrapsToday = Math.Min(60, p.TrapsToday + pressure * dt * (_weather.AirTemp > 22 ? 1.2 : 0.7));
        }

        // Salud del cultivo.
        var heat = _weather.AirTemp > 36 ? 1.6 : 1;
        var drop = 0.0;
        if (p.Moisture < s.LowThreshold) drop += 0.22 * (1 + (s.LowThreshold - p.Moisture) / 8) * heat;
        if (p.Moisture > s.HighThreshold + 4) drop += 0.06;
        if (p.PhytoRisk > 60) drop += 0.08 * (p.PhytoRisk - 60) / 30;
        if (p.TrapsToday > 25) drop += 0.04;
        if (drop > 0) p.Health -= drop * dt;
        else p.Health += 0.05 * dt * (p.Health < s.InitialHealth + 4 ? 1 : 0);
        p.Health = Math.Clamp(p.Health, 20, 99);

        if (p.Health > 80) p.Growth = Math.Min(100, p.Growth + 0.004 * dt);

        // Contadores para reglas basadas en duración.
        p.LowHours = p.Moisture < s.LowThreshold ? p.LowHours + dt : 0;
        p.NearLowHours = p.Moisture < s.LowThreshold + 4 ? p.NearLowHours + dt : 0;
        var irrigatingNow = p.IrrigationRemainingH > 0;
        var anomaly = irrigatingNow
            ? Math.Abs(p.FlowM3h / s.NominalFlowM3h - 1) > 0.35
            : p.FlowM3h > s.NominalFlowM3h * 0.05;
        p.FlowAnomalyHours = anomaly ? p.FlowAnomalyHours + dt : 0;

        if (p.Treated && _simTime > p.TreatedUntil) p.Treated = false;
    }

    private void StepDevice(DeviceState d, double dt)
    {
        if (!d.Offline) d.Battery = Math.Max(0, d.Battery - 0.012 * dt * (d.Seed.Type == "Estación meteorológica" ? 0 : 1));
        d.Signal = d.Offline ? 0 : Math.Clamp(d.Seed.Signal + Gauss(2), 40, 100);
        if (!d.Offline && (_simTime - d.LastTx).TotalMinutes >= 15) d.LastTx = _simTime;
    }

    private void StartIrrigation(PlotState p, double minutes, string origin, bool log = true)
    {
        p.IrrigationRemainingH = Math.Max(p.IrrigationRemainingH, minutes / 60.0);
        if (log) AddEvent("irrigation", $"{origin} · {p.Seed.Name} · {minutes:0} min");
    }

    private void ApplyRecommendation(AlertState alert, PlotState plot)
    {
        switch (alert.RuleId)
        {
            case "water-stress":
            case "water-near":
            case "heat":
                _healthProtected += Math.Max(2, (plot.Seed.LowThreshold - plot.Moisture) * 0.6);
                StartIrrigation(plot, alert.IrrigationMinutes ?? 30, "Recomendación aceptada");
                break;
            case "flow-anomaly":
                plot.LeakFault = false;
                plot.IrrigationRemainingH = 0;
                AddEvent("irrigation", $"Válvula del sector {plot.Seed.Sector} cerrada · aviso a mantenimiento");
                break;
            case "phytophthora":
                plot.Treated = true;
                plot.TreatedUntil = _simTime.AddHours(48);
                plot.SuspendedUntil = _simTime.AddHours(48);
                _healthProtected += 4;
                break;
            case "thrips":
                plot.Treated = true;
                plot.TreatedUntil = _simTime.AddHours(72);
                _healthProtected += 2;
                break;
            case "battery":
                var dev = _devices.FirstOrDefault(d => d.Seed.PlotId == plot.Seed.Id && d.Battery < 20);
                if (dev is not null) dev.Battery = 100;
                break;
            case "offline":
                foreach (var d in _devices.Where(d => d.Seed.PlotId == plot.Seed.Id && d.Offline))
                {
                    d.Offline = false;
                    d.LastTx = _simTime;
                }
                break;
        }
    }

    // ------------------------------------------------------------------ reglas

    private void EvaluateRules()
    {
        var conditions = RulesEngine.Evaluate(_plots, _devices, _weather, _rainLog.Sum(), _simTime);
        var seen = new HashSet<string>();

        foreach (var c in conditions)
        {
            var key = $"{c.RuleId}:{c.PlotId}";
            seen.Add(key);
            if (_activeAlerts.TryGetValue(key, out var existing))
            {
                existing.Update(c);
                existing.ClearedHours = 0;
                continue;
            }

            var alert = new AlertState($"{c.RuleId}-{c.PlotId}-{_runId}{++_alertSeq}", c, _simTime);
            _activeAlerts[key] = alert;
            _alertsRaised++;
            AlertsCounter.Add(1, new KeyValuePair<string, object?>("rule", c.RuleId), new KeyValuePair<string, object?>("severity", c.Severity));
            var plotName = _plots.First(p => p.Seed.Id == c.PlotId).Seed.Name;
            AddEvent("alert", $"{SeverityLabel(c.Severity)} · {c.Title} · {plotName}");
            _logger.LogWarning("Alerta {Rule} ({Severity}) en {Plot}: {Reading}", c.RuleId, c.Severity, plotName, c.Reading);
        }

        foreach (var (key, alert) in _activeAlerts.ToList())
        {
            if (seen.Contains(key)) continue;
            alert.ClearedHours += StepHours;
            // La condición ha desaparecido: archivamos (si se gestionó) o retiramos la alerta.
            if (alert.Resolved || alert.ClearedHours >= 1)
            {
                _activeAlerts.Remove(key);
                if (alert.Resolved)
                {
                    _archivedAlerts.Insert(0, alert);
                    if (_archivedAlerts.Count > 12) _archivedAlerts.RemoveAt(_archivedAlerts.Count - 1);
                }
            }
        }
    }

    private static string SeverityLabel(string severity) => severity switch
    {
        "critical" => "Alerta crítica",
        "warning" => "Aviso",
        _ => "Recomendación",
    };

    // ------------------------------------------------------------------ lectura

    public SnapshotDto GetSnapshot()
    {
        lock (_gate)
        {
            var plots = _plots.Select(ToDto).ToList();
            var alerts = _activeAlerts.Values.Concat(_archivedAlerts)
                .OrderBy(a => a.Resolved)
                .ThenBy(a => SeverityRank(a.Severity))
                .ThenByDescending(a => a.RaisedAt)
                .Select(a => a.ToDto(_simTime))
                .ToList();
            var devices = _devices.Select(DeviceToDto).ToList();

            return new SnapshotDto(
                _runId,
                _simTime,
                DateTimeOffset.UtcNow,
                _speed,
                _paused,
                new ScenarioDto(_scenario.Id, _scenario.Label, _scenario.Description, _scenarioStartedAt),
                new WeatherDto(Math.Round(_weather.AirTemp, 1), Math.Round(_weather.Humidity), Math.Round(_weather.Wind, 1),
                    Math.Round(_weather.Radiation), Math.Round(_et0Today, 1), Math.Round(_rainLog.Sum(), 1), WeatherSummary()),
                plots,
                alerts,
                devices,
                BuildImpact(),
                _events.ToList());
        }
    }

    public IReadOnlyList<HistoryPointDto>? GetHistory(string plotId, int hours)
    {
        lock (_gate)
        {
            var plot = _plots.FirstOrDefault(p => p.Seed.Id == plotId);
            if (plot is null) return null;
            var from = _simTime.AddHours(-Math.Clamp(hours, 1, HistoryDays * 24));
            return plot.History.Where(h => h.Time >= from).ToList();
        }
    }

    public static IReadOnlyList<ScenarioDto> ListScenarios() =>
        Scenarios.All.Select(s => new ScenarioDto(s.Id, s.Label, s.Description, null)).ToList();

    private PlotDto ToDto(PlotState p)
    {
        var s = p.Seed;
        var daily = p.History
            .GroupBy(h => h.Time.Date)
            .OrderBy(g => g.Key)
            .Select(g => Math.Round(g.Average(h => h.Moisture), 1))
            .ToList();
        // El último valor siempre es la lectura actual para que la gráfica "se mueva".
        var current = Math.Round(p.MeasuredMoisture, 1);
        if (daily.Count > 0) daily[^1] = current; else daily.Add(current);

        return new PlotDto(
            s.Id, s.Name, s.Crop, s.Variety, s.AreaHa, s.Owner, s.Phase, s.Sector,
            current,
            Math.Round(p.SoilTemp, 1),
            (int)Math.Round(p.Health),
            (int)Math.Round(p.Growth),
            StressOf(p),
            daily.TakeLast(7).ToArray(),
            daily.TakeLast(30).ToArray(),
            p.IrrigationRemainingH > 0,
            Math.Round(p.FlowM3h, 1),
            s.NominalFlowM3h,
            (int)Math.Round(p.PhytoRisk),
            (int)Math.Round(p.TrapsToday),
            s.LowThreshold,
            s.HighThreshold);
    }

    private static string StressOf(PlotState p)
    {
        var s = p.Seed;
        if (p.Moisture < s.LowThreshold || p.PhytoRisk >= 75 || p.Health < 60) return "critical";
        if (p.Moisture < s.LowThreshold + 4 || p.PhytoRisk >= 50 || p.TrapsToday >= 20 || p.LeakFault) return "warning";
        if (p.Moisture > s.HighThreshold) return "info";
        return "success";
    }

    private DeviceDto DeviceToDto(DeviceState d)
    {
        var plot = _plots.First(p => p.Seed.Id == d.Seed.PlotId);
        var minutes = (int)(_simTime - d.LastTx).TotalMinutes;
        var last = d.Offline ? "hace 3 h" : minutes <= 1 ? "hace 1 min" : $"hace {minutes} min";
        var status = d.Offline ? "Sin señal" : d.Battery < 20 ? "Atención" : "Conectado";
        var reading = d.Seed.Type switch
        {
            "Sonda de humedad" => $"{plot.MeasuredMoisture:0.0} % · {plot.SoilTemp:0.0} °C",
            "Caudalímetro" => d.Offline ? "Sin datos" : $"{plot.FlowM3h:0.0} m³/h",
            "Estación meteorológica" => $"{_weather.AirTemp:0.0} °C · {_weather.Humidity:0} % HR · {_weather.Wind:0} km/h",
            "Sensor foliar" => $"Δ hoja-aire {(plot.Moisture < plot.Seed.LowThreshold ? "+" : "-")}{Math.Abs(_weather.AirTemp - 30) / 6 + 0.4:0.0} °C",
            "Trampa inteligente" => $"{plot.TrapsToday:0} capturas/24 h",
            _ => "",
        };
        return new DeviceDto(d.Seed.Id, d.Seed.Type, plot.Seed.Name, plot.Seed.Id, (int)Math.Round(d.Battery),
            (int)Math.Round(d.Signal), status, last, d.Seed.CalibrationOffset, reading);
    }

    private string WeatherSummary()
    {
        if (_rainLog.TakeLast(12).Sum() > 0.5) return "Lluvia";
        if (_weather.AirTemp >= 36) return "Calor extremo";
        if (_weather.Radiation < 50) return "Noche despejada";
        return _scenario.Id == "pest" ? "Nuboso y húmedo" : "Soleado";
    }

    private ImpactDto BuildImpact()
    {
        var area = _plots.Sum(p => p.Seed.AreaHa);
        var applied = _plots.Sum(p => p.WaterAppliedM3);
        var baseline = _plots.Sum(p => p.WaterBaselineM3);
        var saved = baseline - applied;
        var pct = baseline > 1 ? Math.Clamp(saved / baseline * 100, -50, 45) : 0;
        var days = (_simTime - _impactSince).TotalDays;

        // Proyección anual por hectárea con los supuestos configurables.
        double Weighted(Dictionary<string, double> byCrop) =>
            _plots.Sum(p => p.Seed.AreaHa * byCrop.GetValueOrDefault(p.Seed.Crop)) / area;

        // Con pocos días simulados usamos el ahorro típico (20 %) para que la proyección sea estable.
        var pctForProjection = days < 1 ? 20 : Math.Clamp(pct, 0, 40);
        var baselineHa = Weighted(_impact.BaselineWaterM3HaYear);
        var savedHa = baselineHa * pctForProjection / 100;
        var waterEur = savedHa * _impact.WaterPriceEurM3;
        var energyEur = savedHa * _impact.EnergyEurM3;
        var fertEur = _impact.FertilizerEurHaYear * _impact.FertilizerSavingPct / 100;
        var lossesEur = Weighted(_impact.CropValueEurHa) * _impact.LossesAvoidedPct / 100;
        var total = waterEur + energyEur + fertEur + lossesEur;
        var sub = _impact.SubscriptionEurHaYear;
        var net = total - sub;

        return new ImpactDto(
            Math.Round(area, 1),
            Math.Round(days, 1),
            Math.Round(applied),
            Math.Round(baseline),
            Math.Round(saved),
            Math.Round(pct, 1),
            _alertsRaised,
            _alertsActedOn,
            Math.Round(_healthProtected, 1),
            new ImpactPerHaDto(
                Math.Round(savedHa), Math.Round(waterEur), Math.Round(energyEur), Math.Round(fertEur),
                Math.Round(lossesEur), Math.Round(total), Math.Round(sub), Math.Round(net),
                Math.Round(total / sub, 2), Math.Round(sub / (total / 12), 1)),
            new ImpactAssumptionsDto(
                _impact.WaterPriceEurM3, _impact.EnergyEurM3, Math.Round(baselineHa), _impact.FertilizerEurHaYear,
                _impact.FertilizerSavingPct, Math.Round(Weighted(_impact.CropValueEurHa)), _impact.LossesAvoidedPct, sub,
                "Estimaciones de demo · tarifa del estudio de pricing (490 €/ha/año, tramo 10–30 ha)"));
    }

    private static int SeverityRank(string s) => s switch { "critical" => 0, "warning" => 1, "info" => 2, _ => 3 };

    private void AddEvent(string kind, string text)
    {
        _events.AddFirst(new EventDto(_simTime, kind, text));
        while (_events.Count > 40) _events.RemoveLast();
    }

    private double Gauss(double sigma)
    {
        var u1 = 1.0 - _rng.NextDouble();
        var u2 = _rng.NextDouble();
        return sigma * Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Cos(2 * Math.PI * u2);
    }
}

// ---------------------------------------------------------------------- estado interno

public sealed class Weather
{
    public double AirTemp { get; set; } = 22;
    public double Humidity { get; set; } = 55;
    public double Wind { get; set; } = 8;
    public double Radiation { get; set; }
    public double Et0PerHour { get; set; }
}

public sealed class PlotState(PlotSeed seed)
{
    public PlotSeed Seed { get; } = seed;
    public double Moisture { get; set; } = seed.InitialMoisture;
    public double MeasuredMoisture { get; set; } = seed.InitialMoisture;
    public double SoilTemp { get; set; } = 21;
    public double Health { get; set; } = seed.InitialHealth;
    public double Growth { get; set; } = seed.InitialGrowth;
    public double IrrigationRemainingH { get; set; }
    public double FlowM3h { get; set; }
    public bool LeakFault { get; set; }
    public double RainPendingMm { get; set; }
    public double WetHours { get; set; }
    public double PhytoRisk { get; set; } = 18;
    public double TrapsToday { get; set; } = 3;
    public bool Treated { get; set; }
    public DateTimeOffset TreatedUntil { get; set; }
    public DateTimeOffset SuspendedUntil { get; set; }
    public double LowHours { get; set; }
    public double NearLowHours { get; set; }
    public double FlowAnomalyHours { get; set; }
    public double WaterAppliedM3 { get; set; }
    public double WaterBaselineM3 { get; set; }
    public List<HistoryPointDto> History { get; } = [];
}

public sealed class DeviceState(DeviceSeed seed)
{
    public DeviceSeed Seed { get; } = seed;
    public double Battery { get; set; } = seed.Battery;
    public double Signal { get; set; } = seed.Signal;
    public bool Offline { get; set; } = seed.Offline;
    public DateTimeOffset LastTx { get; set; }
}

public sealed class AlertState(string id, AlertCondition condition, DateTimeOffset raisedAt)
{
    public string Id { get; } = id;
    public string RuleId { get; } = condition.RuleId;
    public string PlotId { get; } = condition.PlotId;
    public string Title { get; private set; } = condition.Title;
    public string Severity { get; private set; } = condition.Severity;
    public AlertCondition Condition { get; private set; } = condition;
    public DateTimeOffset RaisedAt { get; } = raisedAt;
    public int? IrrigationMinutes => Condition.IrrigationMinutes;
    public bool Resolved { get; set; }
    public string? ResolvedStatus { get; set; }
    public double ClearedHours { get; set; }

    public void Update(AlertCondition c)
    {
        // Mientras no se haya gestionado, la alerta refleja la lectura más reciente.
        if (Resolved) return;
        Condition = c;
        Title = c.Title;
        // La gravedad solo escala, nunca baja sola.
        if (Rank(c.Severity) < Rank(Severity)) Severity = c.Severity;
    }

    private static int Rank(string s) => s switch { "critical" => 0, "warning" => 1, "info" => 2, _ => 3 };

    public AlertDto ToDto(DateTimeOffset now)
    {
        var mins = (int)Math.Max(0, (now - RaisedAt).TotalMinutes);
        var time = mins < 1 ? "Ahora" : mins < 60 ? $"Hace {mins} min" : mins < 24 * 60 ? $"Hace {mins / 60} h" : $"Hace {mins / 1440} d";
        return new AlertDto(Id, RuleId, Title, Condition.Description, PlotId, Severity, Condition.Category, time,
            Condition.Recommendation, Condition.Reading, RaisedAt, Resolved, Condition.IrrigationMinutes);
    }
}
