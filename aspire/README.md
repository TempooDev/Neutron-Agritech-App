# Neutron · modo demo con Aspire

Levanta toda la demo con un solo comando: API con simulador de sensores, las apps web y un gateway con portada.

## Requisitos

- .NET 10 SDK
- Node 22 y pnpm (`corepack enable`)
- No hace falta Docker.

## Arrancar

```bash
dotnet run --project aspire/Neutron.AppHost
# o, con la CLI de Aspire instalada:
aspire run --project aspire/Neutron.AppHost
```

La primera vez instala las dependencias de pnpm automáticamente.

| URL | Qué es |
| --- | --- |
| http://localhost:8080 | **Gateway**: portada con acceso a todo |
| http://localhost:8080/campo | App de campo (móvil) |
| http://localhost:8080/panel | Panel de control (gemelo digital) |
| http://localhost:8080/backoffice | Back-office |
| http://localhost:8080/dashboard | Redirige al dashboard de Aspire (métricas `neutron.*` de los sensores, trazas y logs) |
| http://localhost:8080/api/snapshot | Estado completo de la finca en JSON |

El dashboard de Aspire está en http://localhost:15180 y, solo para la demo, no pide token de acceso
(`ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS` en `Neutron.AppHost/Properties/launchSettings.json`).

## Con Docker Compose (sin .NET ni Node)

Para desplegarlo o probarlo en cualquier máquina con Docker, desde la raíz del repo:

```bash
docker compose up --build
```

Se levantan cuatro contenedores en la misma red. El único punto de entrada es **http://localhost:8080**, con las mismas rutas que arriba: portada, `/campo`, `/panel`, `/backoffice`, `/api` y `/dashboard`.

| Servicio | Qué es |
| --- | --- |
| `gateway` | YARP en el puerto 8080 |
| `web` | Build estático de Vite servido con nginx |
| `api` | API de demo con el simulador |
| `dashboard` | Dashboard de Aspire en modo independiente (http://localhost:18888), recibe la telemetría por OTLP |

Los puertos del host se pueden cambiar con `GATEWAY_PORT` (8080 por defecto) y `DASHBOARD_PORT` (18888).

### En Dokploy

En la pestaña *Environment* de la app de compose:

```
GATEWAY_PORT=127.0.0.1:8090
DASHBOARD_PORT=127.0.0.1:18890
DASHBOARD_PUBLIC_URL=https://iot.tudominio.com
```

En *Domains* añade `neutron.tudominio.com` → servicio `gateway`, puerto `8080`, y `iot.tudominio.com` → servicio `dashboard`, puerto `18888`, con HTTPS.
Con `127.0.0.1:` delante, los puertos solo se abren dentro del servidor: el público entra únicamente por los dominios y nunca ve la IP.
La portada no muestra ninguna URL interna.

Si lo despliegas en otro servidor, arranca con `DASHBOARD_PUBLIC_URL=http://<servidor>:18888 docker compose up -d --build` para que `/dashboard` redirija bien.
El dashboard está sin login, así que no lo dejes expuesto a internet más allá de la demo.

## Proyectos

- `Neutron.AppHost`: orquesta la API, el frontend de Vite (raíz del repo) y el gateway.
- `Neutron.DemoApi`: finca semilla Valle Verde (4 parcelas, 11 dispositivos, 30 días de historial), simulador
  de clima y balance hídrico, motor de reglas, escenarios e impacto. Envía un snapshot por segundo por SSE (`/api/stream`).
- `Neutron.Gateway`: YARP. `/api` va a la API, el resto a la web, `/` es la portada y `/dashboard` redirige a Aspire.
- `Neutron.ServiceDefaults`: OpenTelemetry, health checks y service discovery.

## Durante la demo

En cualquier app aparece el botón **Demo** abajo a la izquierda (Ctrl+Shift+D lo oculta).

| Atajo | Acción |
| --- | --- |
| Alt+1 | Condiciones normales |
| Alt+2 | Ola de calor: 40 °C, la humedad cae rápido y saltan alertas de golpe de calor |
| Alt+3 | Brote de plaga: lluvia en El Manantial → riesgo de Phytophthora; trips en El Molino |
| Alt+4 | Fallo de riego: fuga en el sector 2, el caudalímetro marca de más |
| Alt+0 | Reiniciar la demo |
| Alt+I | Panel de impacto a pantalla completa |

Por defecto 1 s real = 10 min en la finca (×600). Se puede cambiar a ×60 o ×1800 o pausar.

Aceptar una recomendación en la app (por ejemplo «Iniciar riego sector 3») la ejecuta en el simulador:
la humedad sube y la alerta se cierra. Si la app de campo está en «sin conexión», la orden se envía al reconectar.

**Respaldo sin API.** Si la web no encuentra la API (por ejemplo con `pnpm dev` a secas o en el despliegue estático),
arranca un simulador equivalente dentro del navegador y lo indica con «simulación local». Sigue reintentando la API
cada 10 s. En el panel también se puede forzar este modo.

## Ajustar el impacto

Los supuestos económicos están en `Neutron.DemoApi/appsettings.json` (sección `Impact`): precio del agua, bombeo,
consumo de referencia por cultivo, valor de cosecha, ahorro en fertilizantes y la cuota de 490 €/ha/año del estudio de pricing.
Son estimaciones de demo, no datos de campo. El simulador local del navegador usa los mismos valores (`src/demo/localSim.ts`).
