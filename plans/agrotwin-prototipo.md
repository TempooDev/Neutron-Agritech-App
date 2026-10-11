# Plan de implementación: AgroTwin, prototipo Campo + Administración

## 1. Objetivo y criterios de éxito

Construir en el scaffold existente una demo frontend navegable de una plataforma agritech para una cooperativa mediterránea ficticia con cultivos de aguacate y pitaya. La misma aplicación permitirá alternar entre dos experiencias claramente diferenciadas:

- **Campo**: interfaz móvil para agricultores y operarios, optimizada para uso rápido, alta legibilidad y conectividad intermitente.
- **Administración**: WebApp de escritorio para administradores e ingenieros agrónomos, orientada al gemelo digital, la configuración y la analítica.

La demo se considerará completa cuando:

- Todas las áreas solicitadas estén representadas mediante vistas navegables y datos realistas simulados.
- Los flujos principales (cambiar experiencia, consultar parcelas/alertas, aceptar o rechazar recomendaciones, simular offline y sincronizar, crear soporte, inspeccionar/configurar entidades administrativas) tengan respuesta visual y estado persistente cuando corresponda.
- La interfaz funcione correctamente en viewport móvil y escritorio, sin depender de backend, mapas o APIs externas.
- La aplicación esté completamente en español y mantenga una identidad visual agritech coherente y accesible.

## 2. Alcance acordado

- Un único proyecto React con un **selector visible de experiencia Campo/Admin**, sin rutas independientes.
- Prototipo integral de ambos productos, priorizando una demostración convincente de cada módulo por encima de cubrir lógica empresarial de producción.
- Datos simulados en el navegador y persistencia local básica mediante `localStorage`.
- Sin autenticación real, backend, geolocalización real, mapas externos, notificaciones push, telemetría IoT o generación real de archivos.
- Contexto de muestra: cooperativa española ficticia, explotaciones mediterráneas, aguacate y pitaya.

## 3. Dirección visual

- Estética **agritech sobria y técnica**: verde bosque profundo como color de navegación, superficies marfil/mineral, verde vivo para estados saludables, ámbar para atención y rojo coral para incidencias críticas.
- Tipografía sans de sistema, números tabulares en métricas y jerarquía fuerte para lectura rápida.
- Campo: tarjetas grandes, controles de al menos 44 px, textos de alto contraste, poca densidad por pantalla y navegación inferior fija.
- Administración: shell con sidebar, barra superior, retícula más densa y paneles de datos.
- Iconografía consistente mediante `lucide-react`; no se usarán emojis como iconos.
- Gráficas y mapa esquemático construidos con SVG/CSS para evitar dependencias pesadas y servicios cartográficos. El mapa se presentará explícitamente como una visualización simulada de parcelas, no como cartografía real.
- Transiciones breves para tabs, drawers, estados seleccionados y feedback; respetar `prefers-reduced-motion`.

## 4. Arquitectura de implementación

### Dependencias

- Añadir `lucide-react` para iconografía consistente.
- Mantener React, Vite y Tailwind CSS v4 existentes; no añadir router, librería de gráficas ni gestor de estado.

### Organización propuesta

- `src/App.tsx`: estado superior, selector de experiencia y composición de shells.
- `src/components/field/FieldApp.tsx`: shell móvil, navegación inferior y vistas de Campo.
- `src/components/admin/AdminApp.tsx`: shell desktop, sidebar y vistas administrativas.
- `src/components/shared/`: componentes reutilizables (`StatusBadge`, `MetricCard`, `MiniChart`, `SectionHeader`, `Toast`, `Modal/Drawer`).
- `src/data/mockData.ts`: datos simulados tipados de cooperativa, fincas, parcelas, alertas, dispositivos, usuarios, reglas, predicciones e integraciones.
- `src/types.ts`: tipos compartidos y uniones de estados/severidad.
- `src/index.css`: tokens visuales Tailwind v4/CSS, estilos base, safe areas móviles y pequeñas utilidades globales.

Si mantener algunos componentes juntos resulta más claro durante la implementación, se conservará la separación por experiencia y datos sin crear abstracciones de una sola utilización.

### Estado y persistencia

- `useState` para navegación, filtros, selección y overlays.
- Hook pequeño de persistencia local para:
  - experiencia seleccionada;
  - recomendaciones aceptadas/rechazadas y motivos;
  - tickets de soporte creados;
  - modo de conectividad simulado;
  - cola de actuaciones pendientes de sincronización.
- Proteger la lectura de `localStorage` con valores iniciales válidos y tolerar datos ausentes/corruptos volviendo al mock inicial.
- Acciones administrativas de edición se simularán con estado local y feedback visual, sin prometer persistencia de servidor.

## 5. Experiencia Campo

### Shell y navegación

- Marco móvil centrado en escritorio y a ancho completo en móvil.
- Cabecera con cooperativa, explotación activa, avatar y estado de conexión.
- Navegación inferior: **Inicio**, **Alertas**, **Actuaciones**, **Soporte**.
- Control accesible “Simular sin conexión/conectar” para demostrar offline sin depender del navegador.
- En offline, mostrar banner persistente con número de cambios pendientes; al reconectar, ofrecer sincronización y confirmar su resultado.

### Inicio / Estado general

- Saludo contextual, selector de finca/parcela y resumen de última actualización.
- Tarjetas grandes: estado del cultivo, humedad del suelo, riego de hoy y tareas pendientes.
- Gráfica temporal compacta de humedad/estrés con selector 7/30 días.
- Lista visual de parcelas con salud, cultivo, fase y tendencia; tocar una parcela actualiza el resumen.
- Bloque prioritario “Siguiente actuación” con acceso directo al detalle.

### Alertas y recomendaciones

- Contadores por gravedad y filtros `Todas`, `Críticas`, `Recomendaciones`.
- Tarjetas con severidad, parcela/zona, distancia o sector, marca temporal y recomendación accionable.
- Detalle en drawer/modal con contexto agronómico, ubicación esquemática, evidencia/lecturas y acción sugerida.
- Botones claros para aceptar, posponer o abrir el flujo de rechazo.

### Feedback de actuaciones

- Bandeja separada por `Pendientes`, `Registradas` y `Por sincronizar`.
- Al aceptar: registrar fecha, usuario y estado; si está offline, añadir a cola local.
- Al rechazar: motivo opcional seleccionable (no aplica, ya realizada, condiciones no adecuadas, otro) y campo de comentario opcional.
- Resumen de trazabilidad visible en la actuación ya registrada.
- Toast de confirmación y actualización inmediata de contadores.

### Soporte

- Acciones rápidas para nuevo ticket y consulta de preguntas frecuentes.
- Formulario breve: categoría, prioridad, asunto y descripción; envío simulado/persistido localmente.
- Historial con estado `Abierto`, `En revisión` o `Resuelto` y número de ticket.
- Si está offline, el ticket se marca como pendiente de envío y entra en la cola de sincronización.

## 6. Experiencia Administración

### Shell

- Sidebar fija/colapsable con módulos, identidad de la cooperativa y selector Campo/Admin.
- Barra superior con búsqueda visual, periodo activo, estado global de dispositivos y perfil.
- En anchos reducidos, sidebar convertida en drawer; contenido sin overflow horizontal accidental.

### Resumen / Gemelo digital

- KPIs: superficie monitorizada, alertas activas, ahorro estimado de agua, dispositivos conectados.
- Mapa SVG interactivo de una finca con polígonos por parcela y modo visual seleccionable: **estrés hídrico**, **fitosanitario** y **crecimiento**.
- Leyenda, tooltip/selección y panel lateral de la parcela elegida.
- Curva de crecimiento y humedad temporal, alertas recientes y recomendación principal.
- Selector de explotación para cambiar los datos mostrados.

### Explotaciones y especialización

- Árbol jerárquico cooperativa → socio → explotación → parcela.
- Panel de detalle con cultivo, superficie, marco de plantación, sistema de riego y responsable.
- Perfiles agronómicos para aguacate y pitaya con reglas/resúmenes diferenciados.
- Acción simulada para asignar perfil y confirmación visible.

### Clientes, usuarios y roles

- Tabla con búsqueda/filtro por rol y estado.
- Roles: dirección de explotación, responsable agronómico, responsable de riego y operario.
- Drawer de alta/edición simulado con datos básicos, explotación asignada y rol.
- Matriz/resumen de permisos legible, sin implementar autenticación real.

### Dispositivos IoT

- Resumen de conectividad, batería baja, fallos y última recepción.
- Tabla/tarjetas de sensores con tipo, parcela, señal, batería, estado y última lectura.
- Filtros de estado y panel de detalle/configuración simulado.
- Estados visuales inequívocos y no dependientes solo del color.

### Reglas y automatización

- Listado de reglas con cultivo, condición/umbral, gravedad, estado y última activación.
- Activar/desactivar reglas en estado local y abrir edición simulada de umbral/gravedad.
- Bloque separado de automatización de riego con autorización previa, límites de seguridad y confirmación antes de habilitar.

### Modelos predictivos y analítica

- Predicción de rendimiento por cultivo/explotación, comparación con campaña anterior e intervalo estimado.
- Curvas SVG de volumen esperado y ventana óptima de recolección.
- Selector de escenario/periodo y explicación breve de factores principales para evitar una métrica de IA opaca.

### Informes y cumplimiento

- Tarjetas de consumo de agua, insumos y eficiencia.
- Generador simulado con tipo de informe, explotación y rango temporal.
- Historial con estados y acción “Descargar”; en la demo, la descarga mostrará confirmación o generará un archivo de texto/CSV sencillo si resulta útil sin añadir complejidad.
- Etiquetas de finalidad normativa/justificación de inversión.

### Integraciones y servicios externos

- Tarjetas de proveedores meteorológicos, asesoría agronómica y hardware con estado de conexión.
- Solicitudes de asistencia con proveedor, asunto, prioridad y estado.
- Formulario simulado de nueva solicitud y feedback inmediato.

## 7. Datos de muestra

Definir un conjunto compacto pero consistente, reutilizado entre ambas experiencias:

- Cooperativa `Valle Verde`.
- Socios/explotaciones como `Finca El Manantial` y `Cortijo del Sol`.
- Parcelas de aguacate Hass y pitaya roja con superficies, coordenadas esquemáticas y métricas coherentes.
- Alertas: estrés hídrico crítico, riesgo de Phytophthora, batería baja y recomendación de poda/recolección.
- Dispositivos: sondas de humedad, estación meteorológica, caudalímetro y sensor foliar.
- Series temporales cortas para humedad, crecimiento y rendimiento.
- Los mismos identificadores enlazarán parcela, alerta, actuación y dispositivo para que la demo parezca un sistema único.

## 8. Comportamiento responsive y accesibilidad

- Diseñar Campo mobile-first para 360–430 px, comprobando también tablet/escritorio.
- Diseñar Administración para 1280–1440 px y adaptar a 768 px con sidebar móvil y tablas desplazables solo cuando sea inevitable.
- Foco visible, navegación por teclado, botones con `aria-label` cuando solo contengan icono, labels reales en formularios y estados anunciables para toasts/modales.
- Contraste AA, severidades con icono/texto además de color, targets táctiles mínimos de 44 px y soporte de safe-area en navegación móvil.
- Estados vacíos razonables al filtrar listas, sin resultados rotos.

## 9. Secuencia de implementación

1. Invocar la guía de sistema de diseño antes de editar UI y definir tokens, tipografía, iconografía y primitives compartidos.
2. Añadir tipos y datos simulados consistentes.
3. Implementar el selector de experiencia y los shells responsive.
4. Construir la experiencia Campo completa, incluido feedback y simulación offline/persistencia.
5. Construir el gemelo digital y después el resto de módulos administrativos reutilizando primitives.
6. Añadir overlays, toasts, formularios y estados interactivos finales.
7. Ajustar responsive, accesibilidad, estados vacíos y microinteracciones.
8. Formatear y verificar.

## 10. Verificación

- Ejecutar `pnpm format` después de los cambios y revisar que no introduzca modificaciones inesperadas.
- Ejecutar `pnpm build` por tratarse de una implementación amplia y confirmar TypeScript/Vite sin errores.
- Revisar manualmente en el preview existente, sin iniciar otro servidor:
  - alternancia Campo/Admin y persistencia tras recarga;
  - navegación completa en ambas experiencias;
  - selección de parcela y modos del mapa;
  - aceptar/rechazar recomendación con y sin motivo;
  - activar offline, crear actuación/ticket, ver cola, reconectar y sincronizar;
  - filtros con y sin resultados;
  - drawers/modales y foco básico;
  - vista móvil ~390 px, tablet ~768 px y escritorio ~1440 px;
  - ausencia de overflow, textos cortados o controles inaccesibles.
- Si surge un fallo de runtime concreto, usar `figma logs` únicamente para diagnosticarlo, según las instrucciones del entorno.

## 11. Límites explícitos de la demo

- La capa “offline” demuestra UX, cola y persistencia local; no implementa service worker, caché de assets ni sincronización en segundo plano real.
- El gemelo digital usa geometrías y métricas simuladas; no integra GIS.
- Las predicciones son valores de muestra, no resultados de un modelo real.
- Altas, configuraciones, automatizaciones, integraciones y descargas no llaman servicios externos.
- Las notificaciones geoespaciales se representan en interfaz, sin push ni tracking de ubicación real.
