namespace Neutron.DemoApi.Simulation;

/// <summary>
/// Definición estática de una parcela de la finca ficticia (cooperativa Valle Verde).
/// Los ids y nombres coinciden con src/data.ts para que el frontend pueda fusionar los datos.
/// </summary>
public sealed record PlotSeed(
    string Id,
    string Name,
    string Crop,
    string Variety,
    double AreaHa,
    string Owner,
    string Phase,
    int Sector,
    double Kc,
    double LowThreshold,
    double TargetMoisture,
    double HighThreshold,
    double InitialMoisture,
    double InitialHealth,
    double InitialGrowth,
    // Riego programado "de siempre" del agricultor (minutos/día a las 06:00).
    double ProgrammedMinutes,
    // Caudal nominal del sector en m³/h.
    double NominalFlowM3h,
    string FlowMeterId);

public sealed record DeviceSeed(
    string Id,
    string Type,
    string PlotId,
    double Battery,
    double Signal,
    bool Offline = false,
    double CalibrationOffset = 0);

public static class FarmSeed
{
    public const string Cooperative = "Valle Verde";

    // Caudal de goteo típico: ~40 m³/h por hectárea (≈4 mm/h).
    public static readonly IReadOnlyList<PlotSeed> Plots =
    [
        new("p1", "La Umbría", "Aguacate", "Hass", 8.4, "Finca El Manantial", "Engorde de fruto",
            Sector: 1, Kc: 0.75, LowThreshold: 35, TargetMoisture: 48, HighThreshold: 68,
            InitialMoisture: 41, InitialHealth: 92, InitialGrowth: 78,
            ProgrammedMinutes: 54, NominalFlowM3h: 8.4 * 40, FlowMeterId: "CAU-004"),
        new("p2", "Los Naranjos", "Aguacate", "Hass", 5.2, "Finca El Manantial", "Engorde de fruto",
            Sector: 2, Kc: 0.75, LowThreshold: 35, TargetMoisture: 50, HighThreshold: 70,
            InitialMoisture: 56, InitialHealth: 97, InitialGrowth: 84,
            ProgrammedMinutes: 54, NominalFlowM3h: 5.2 * 40, FlowMeterId: "CAU-012"),
        new("p3", "Loma Alta", "Pitaya", "Roja", 3.7, "Cortijo del Sol", "Floración",
            Sector: 3, Kc: 0.5, LowThreshold: 34, TargetMoisture: 45, HighThreshold: 65,
            InitialMoisture: 30, InitialHealth: 71, InitialGrowth: 66,
            // Infra-dosificado a propósito: la parcela tiende a secarse.
            ProgrammedMinutes: 26, NominalFlowM3h: 3.7 * 40, FlowMeterId: "CAU-009"),
        new("p4", "El Molino", "Pitaya", "Amarilla", 4.9, "Cortijo del Sol", "Cuajado",
            Sector: 4, Kc: 0.5, LowThreshold: 30, TargetMoisture: 44, HighThreshold: 65,
            InitialMoisture: 47, InitialHealth: 88, InitialGrowth: 72,
            ProgrammedMinutes: 36, NominalFlowM3h: 4.9 * 40, FlowMeterId: "CAU-015"),
    ];

    public static readonly IReadOnlyList<DeviceSeed> Devices =
    [
        new("HUM-018", "Sonda de humedad", "p1", 82, 94),
        new("FOL-011", "Sensor foliar", "p1", 73, 91),
        new("CAU-004", "Caudalímetro", "p1", 88, 86),
        new("MET-003", "Estación meteorológica", "p2", 100, 88),
        new("HUM-021", "Sonda de humedad", "p2", 91, 90),
        new("CAU-012", "Caudalímetro", "p2", 76, 83),
        new("HUM-030", "Sonda de humedad", "p3", 64, 78),
        new("CAU-009", "Caudalímetro", "p3", 67, 0, Offline: true, CalibrationOffset: 1),
        new("HUM-024", "Sonda de humedad", "p4", 14, 72, CalibrationOffset: -2),
        new("TRP-002", "Trampa inteligente", "p4", 58, 80),
        new("CAU-015", "Caudalímetro", "p4", 81, 84),
    ];
}
