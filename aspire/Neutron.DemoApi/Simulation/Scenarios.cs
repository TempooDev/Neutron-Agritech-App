namespace Neutron.DemoApi.Simulation;

public sealed record Scenario(
    string Id,
    string Label,
    string Description,
    double TempOffset = 0,
    double HumidityOffset = 0,
    double WindOffset = 0);

/// <summary>Escenarios guionados que el presentador puede lanzar en directo.</summary>
public static class Scenarios
{
    public static readonly Scenario Normal = new("normal", "Condiciones normales",
        "Clima mediterráneo de otoño templado, riego programado a las 06:00.");

    public static readonly Scenario Heatwave = new("heatwave", "Ola de calor",
        "Máximas de 40 °C, humedad relativa muy baja y viento de poniente. La ETc casi se duplica.",
        TempOffset: 11, HumidityOffset: -25, WindOffset: 8);

    public static readonly Scenario Pest = new("pest", "Brote de plaga",
        "Episodio de lluvia y humedad alta en Finca El Manantial (riesgo de Phytophthora) y repunte de trips en El Molino.",
        TempOffset: -3, HumidityOffset: 18);

    public static readonly Scenario IrrigationFailure = new("irrigation-failure", "Fallo de riego",
        "Rotura en la tubería del sector 2 (Los Naranjos): el caudalímetro marca de más y la humedad no sube.");

    public static readonly IReadOnlyList<Scenario> All = [Normal, Heatwave, Pest, IrrigationFailure];
}
