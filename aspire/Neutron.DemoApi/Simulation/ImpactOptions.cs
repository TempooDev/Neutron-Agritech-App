namespace Neutron.DemoApi.Simulation;

/// <summary>
/// Supuestos económicos del panel de impacto. Se leen de la sección "Impact" de appsettings.json
/// para poder ajustarlos sin recompilar. Son estimaciones de demo, no datos de campo.
/// </summary>
public sealed class ImpactOptions
{
    public double WaterPriceEurM3 { get; set; } = 0.35;
    public double EnergyEurM3 { get; set; } = 0.12;
    public Dictionary<string, double> BaselineWaterM3HaYear { get; set; } = new() { ["Aguacate"] = 6500, ["Pitaya"] = 3500 };
    public Dictionary<string, double> CropValueEurHa { get; set; } = new() { ["Aguacate"] = 24000, ["Pitaya"] = 30000 };
    public double FertilizerEurHaYear { get; set; } = 900;
    public double FertilizerSavingPct { get; set; } = 10;
    public double LossesAvoidedPct { get; set; } = 2;
    // Tarifa del estudio de pricing (tramo 10–30 ha, equipos incluidos).
    public double SubscriptionEurHaYear { get; set; } = 490;
    // Margen de sobre-riego del programa fijo tradicional frente a la ETc real.
    public double TraditionalOverIrrigationFactor { get; set; } = 1.35;
}
