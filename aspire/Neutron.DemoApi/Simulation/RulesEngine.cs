namespace Neutron.DemoApi.Simulation;

public sealed record AlertCondition(
    string RuleId,
    string PlotId,
    string Title,
    string Description,
    string Severity,
    string Category,
    string Recommendation,
    string Reading,
    int? IrrigationMinutes = null);

/// <summary>
/// Motor de reglas agronómicas. Sin modelos entrenados: umbrales y duraciones explicables,
/// que es justo lo que un técnico puede validar en campo.
/// </summary>
public static class RulesEngine
{
    private const double MmToPct = FarmSimulator.MmToPct;

    public static IEnumerable<AlertCondition> Evaluate(
        IReadOnlyList<PlotState> plots,
        IReadOnlyList<DeviceState> devices,
        Weather weather,
        double rainLast24h,
        DateTimeOffset now)
    {
        foreach (var p in plots)
        {
            var s = p.Seed;

            // 1. Estrés hídrico: humedad por debajo del umbral durante al menos 1 h.
            if (p.LowHours >= 1)
            {
                var minutes = IrrigationMinutesToTarget(p);
                yield return new AlertCondition("water-stress", s.Id,
                    "Estrés hídrico elevado",
                    $"La humedad lleva {FormatHours(p.LowHours)} por debajo del umbral de {s.Crop.ToLowerInvariant()} ({s.LowThreshold:0} %).",
                    "critical", "Riego",
                    $"Iniciar riego sector {s.Sector} durante {minutes} minutos",
                    $"{p.MeasuredMoisture:0.0}% humedad · umbral {s.LowThreshold:0}%",
                    minutes);
            }
            // 2. Humedad acercándose al umbral (aviso preventivo).
            else if (p.NearLowHours >= 1.5 && p.IrrigationRemainingH <= 0)
            {
                var minutes = IrrigationMinutesToTarget(p);
                yield return new AlertCondition("water-near", s.Id,
                    "Humedad cerca del umbral",
                    $"La tendencia de las últimas horas indica que {s.Name} cruzará el umbral antes del próximo riego programado.",
                    "warning", "Riego",
                    $"Adelantar riego del sector {s.Sector}: {minutes} minutos",
                    $"{p.MeasuredMoisture:0.0}% humedad · umbral {s.LowThreshold:0}%",
                    minutes);
            }

            // 3. Caudal anómalo durante el riego (fuga u obstrucción).
            if (p.FlowAnomalyHours >= 1.0 / 6)
            {
                var ratio = p.FlowM3h / s.NominalFlowM3h * 100;
                yield return new AlertCondition("flow-anomaly", s.Id,
                    p.IrrigationRemainingH <= 0 ? "Caudal fuera de programa: posible fuga"
                        : ratio > 100 ? "Caudal anómalo: posible fuga" : "Caudal bajo: posible obstrucción",
                    p.IrrigationRemainingH <= 0
                        ? $"El caudalímetro {s.FlowMeterId} registra {p.FlowM3h:0} m³/h con la válvula cerrada. Se está perdiendo agua."
                        : $"El caudalímetro {s.FlowMeterId} marca {ratio:0}% del caudal nominal y la humedad del suelo no responde al riego.",
                    "critical", "Riego",
                    $"Cerrar la válvula del sector {s.Sector} y revisar la tubería principal",
                    $"{p.FlowM3h:0} m³/h · nominal {s.NominalFlowM3h:0} m³/h");
            }

            // 4. Riesgo de Phytophthora en aguacate.
            if (s.Crop == "Aguacate" && p.PhytoRisk >= 50)
            {
                yield return new AlertCondition("phytophthora", s.Id,
                    "Riesgo de Phytophthora",
                    "Suelo saturado y temperatura radicular templada durante varias horas: condiciones favorables para Phytophthora cinnamomi.",
                    p.PhytoRisk >= 75 ? "critical" : "warning", "Sanidad",
                    "Suspender riego 48 h y aplicar fosetil-Al en la zona norte",
                    $"Riesgo estimado {p.PhytoRisk:0}% · humedad {p.MeasuredMoisture:0}%");
            }

            // 5. Repunte de trips en pitaya (trampa inteligente).
            if (s.Crop == "Pitaya" && p.TrapsToday >= 20)
            {
                yield return new AlertCondition("thrips", s.Id,
                    "Aumento de capturas de trips",
                    "La trampa cromática registra un número de capturas muy superior a la media de la semana.",
                    p.TrapsToday >= 35 ? "critical" : "warning", "Sanidad",
                    "Revisar flores y programar suelta de Orius laevigatus",
                    $"{p.TrapsToday:0} capturas/24 h · media 3");
            }

            // 6. Golpe de calor.
            if (weather.AirTemp >= 37 && (s.Crop == "Aguacate" || p.Moisture < s.TargetMoisture))
            {
                var minutes = Math.Max(20, IrrigationMinutesToTarget(p) / 2);
                yield return new AlertCondition("heat", s.Id,
                    "Golpe de calor en curso",
                    $"Temperatura del aire de {weather.AirTemp:0.0} °C y humedad relativa del {weather.Humidity:0}%. El {s.Crop.ToLowerInvariant()} cierra estomas y el fruto puede quemarse.",
                    "critical", "Labor",
                    $"Pulso de riego de {minutes} min ahora y adelantar el programa a las 05:00",
                    $"{weather.AirTemp:0.0} °C · HR {weather.Humidity:0}% · ETc ×{1 + (weather.AirTemp - 29) / 12:0.0}",
                    minutes);
            }

            // 7. Ventana de poda (informativa), solo con buen tiempo de mañana.
            if (s.Id == "p2" && now.Hour is >= 7 and < 12 && weather.Wind < 12 && rainLast24h < 0.5 && weather.AirTemp < 32)
            {
                yield return new AlertCondition("pruning", s.Id,
                    "Ventana óptima de poda",
                    "Previsión sin lluvia y viento flojo: buena cicatrización de cortes en las próximas 48 horas.",
                    "info", "Labor",
                    "Programar poda ligera de mantenimiento",
                    $"Viento {weather.Wind:0} km/h · sin lluvia");
            }
        }

        // 8. Dispositivos.
        foreach (var d in devices)
        {
            if (d.Offline)
            {
                yield return new AlertCondition("offline", d.Seed.PlotId,
                    $"{d.Seed.Type} sin señal",
                    $"{d.Seed.Id} no transmite desde hace más de 3 horas. Sin este dato el riego del sector se decide a ciegas.",
                    "warning", "Dispositivo",
                    "Revisar gateway LoRaWAN y alimentación del equipo",
                    $"{d.Seed.Id} · señal 0%");
            }
            else if (d.Battery < 20)
            {
                yield return new AlertCondition("battery", d.Seed.PlotId,
                    "Batería de sonda baja",
                    $"La sonda {d.Seed.Id} puede dejar de transmitir en las próximas 48 horas si no se recarga.",
                    "warning", "Dispositivo",
                    $"Sustituir batería o limpiar panel solar de {d.Seed.Id}",
                    $"Batería {d.Battery:0}%");
            }
        }
    }

    private static int IrrigationMinutesToTarget(PlotState p)
    {
        // Objetivo: dejar la parcela 6 puntos por encima del umbral, sin encharcar.
        var deficitMm = Math.Max(0, (p.Seed.LowThreshold + 6 - p.Moisture) / MmToPct);
        var hours = deficitMm * p.Seed.AreaHa * 10 / p.Seed.NominalFlowM3h;
        return (int)Math.Clamp(Math.Ceiling(hours * 60 / 5) * 5, 15, 150);
    }

    private static string FormatHours(double h) => h < 1.5 ? "1 hora" : $"{h:0} horas";
}
