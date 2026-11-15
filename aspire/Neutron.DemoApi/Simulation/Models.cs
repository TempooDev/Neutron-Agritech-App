namespace Neutron.DemoApi.Simulation;

// DTOs que se envían al frontend. Los nombres de propiedad salen en camelCase
// y encajan con los tipos de src/data.ts (Plot, AlertItem, DeviceItem).

public sealed record WeatherDto(
    double AirTemp,
    double Humidity,
    double Wind,
    double Radiation,
    double Et0Today,
    double RainLast24h,
    string Summary);

public sealed record PlotDto(
    string Id,
    string Name,
    string Crop,
    string Variety,
    double Area,
    string Owner,
    string Phase,
    int Sector,
    double Moisture,
    double SoilTemp,
    int Health,
    int Growth,
    string Stress,
    double[] Trend,
    double[] Trend30,
    bool Irrigating,
    double FlowM3h,
    double NominalFlowM3h,
    int PhytoRisk,
    int TrapCount,
    double LowThreshold,
    double HighThreshold);

public sealed record AlertDto(
    string Id,
    string RuleId,
    string Title,
    string Description,
    string PlotId,
    string Severity,
    string Category,
    string Time,
    string Recommendation,
    string Reading,
    DateTimeOffset RaisedAt,
    bool Resolved,
    int? IrrigationMinutes);

public sealed record DeviceDto(
    string Id,
    string Type,
    string Plot,
    string PlotId,
    int Battery,
    int Signal,
    string Status,
    string Last,
    double CalibrationOffset,
    string Reading);

public sealed record EventDto(DateTimeOffset SimTime, string Kind, string Text);

public sealed record ScenarioDto(string Id, string Label, string Description, DateTimeOffset? StartedAt);

public sealed record ImpactDto(
    double TotalAreaHa,
    double SimulatedDays,
    double WaterAppliedM3,
    double WaterBaselineM3,
    double WaterSavedM3,
    double WaterSavedPct,
    int AlertsRaised,
    int AlertsActedOn,
    double HealthProtectedPts,
    ImpactPerHaDto PerHa,
    ImpactAssumptionsDto Assumptions);

public sealed record ImpactPerHaDto(
    double WaterSavedM3,
    double WaterEur,
    double EnergyEur,
    double FertilizerEur,
    double LossesAvoidedEur,
    double TotalBenefitEur,
    double SubscriptionEur,
    double NetBenefitEur,
    double Roi,
    double PaybackMonths);

public sealed record ImpactAssumptionsDto(
    double WaterPriceEurM3,
    double EnergyEurM3,
    double BaselineWaterM3HaYear,
    double FertilizerEurHaYear,
    double FertilizerSavingPct,
    double CropValueEurHa,
    double LossesAvoidedPct,
    double SubscriptionEurHaYear,
    string Source);

public sealed record SnapshotDto(
    string RunId,
    DateTimeOffset SimTime,
    DateTimeOffset ServerTime,
    double Speed,
    bool Paused,
    ScenarioDto Scenario,
    WeatherDto Weather,
    IReadOnlyList<PlotDto> Plots,
    IReadOnlyList<AlertDto> Alerts,
    IReadOnlyList<DeviceDto> Devices,
    ImpactDto Impact,
    IReadOnlyList<EventDto> Events);

public sealed record HistoryPointDto(DateTimeOffset Time, double Moisture, double SoilTemp, double AirTemp, double FlowM3h, int Health);

public sealed record IrrigateRequest(int Minutes);
public sealed record SpeedRequest(double Speed);
public sealed record ResolveRequest(string Status, string? Reason);
