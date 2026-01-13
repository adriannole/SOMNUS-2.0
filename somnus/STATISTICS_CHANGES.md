# Cambios en la Pantalla de Estadísticas

## Resumen
Se ha implementado una pantalla completa de estadísticas de sueño con:
1. **Heatmap de 30 días**: Calendario visual mostrando Night Score de cada día con colores:
   - Verde (80+): Excelente
   - Amarillo (60-79): Bueno
   - Rojo (0-59): Pobre
   
2. **Timeline Graph**: Gráfico de líneas mostrando el ciclo de sueño del día seleccionado:
   - Duración total del sueño
   - Pickups (despertares)
   - Transiciones entre dormido/despierto

3. **Estadísticas Generales**: Resumen con:
   - Score promedio de 30 días
   - Horas promedio de sueño
   - Número de noches excelentes

## Archivos Modificados

### 1. `src/services/sleepTracker.js`
- **Cambio**: Modificó `generateTestData()` para generar 30 días en lugar de 7
- **Detalles**:
  - Loop: `for (let i = 6; i >= 0; i--)` → `for (let i = 29; i >= 0; i--)`
  - Mantiene lógica de scoring (penalizaciones por duración, pickups, tiempo despierto)
  - Genera datos realistas con startTime/endTime para visualizar en gráficos

### 2. `app/(tabs)/explore.tsx`
- **Cambio**: Reemplazó contenido de demostración con StatisticsScreen
- **Contenido anterior**: Collapsibles con ejemplos de Expo
- **Nuevo contenido**: Importa y renderiza StatisticsScreen

## Archivos Nuevos Creados

### 1. `src/screens/StatisticsScreen.js`
**Pantalla principal de estadísticas con:**
- Carga de datos de sueño desde AsyncStorage
- Heatmap interactivo (SleepHeatmap component)
- Estadísticas generales (score, horas, noches excelentes)
- Modal detallado al hacer click en un día:
  - Stats detallados del día
  - Timeline chart animado
  - Información de pickups, movimientos, calidad

**Estructura:**
```
StatisticsScreen
├── Header "Estadísticas"
├── SleepHeatmap (30 días)
├── Stats Grid (3 cards)
└── Modal Detail
    ├── Day Stats
    ├── SleepTimelineChart
    └── Additional Stats
```

### 2. `src/components/SleepHeatmap.js`
**Componente de visualización de calendario:**
- Grid de 7x5 (30 días en semanas)
- Celdas interactivas con touch handlers
- Colores basados en Night Score
- Números de día y score visibles
- Leyenda de colores (80+, 60-79, 0-59)

**Props:**
- `data`: Array de sesiones de sueño
- `onDayPress(dayData)`: Callback cuando se selecciona un día

### 3. `src/components/SleepTimelineChart.js`
**Componente SVG para mostrar timeline de sueño:**
- Gráfico de líneas usando react-native-svg
- X-axis: Tiempo (horas)
- Y-axis: Estado (durmiendo/despierto)
- Puntos coloreados:
  - Verde: Durmiendo
  - Rojo: Pickup (despierto)
  - Amarillo: Fin
- Líneas de referencia horarias
- Leyenda y estadísticas

**Props:**
- `startTime`: ISO string de inicio de sueño
- `endTime`: ISO string de fin de sueño
- `pickups`: Número de despertares
- `hoursSlept`: Horas dormidas

## Cambios Adicionales

### `app/_layout.tsx`
- **Removido**: `detachPreviousScreen: false` que causaba error de TypeScript
- **Razón**: No es una opción válida en expo-router v6

## Datos Generados

Cada sesión de sueño ahora contiene:
```javascript
{
  date: "2024-01-15T23:00:00.000Z",
  score: 78,                    // 0-100, calculado con penalizaciones
  hoursSlept: 7.5,              // 6-9 horas
  timeAwake: 0.3,               // 0-0.5 horas
  nighttimePickups: 2,          // 0-4 despertares
  movements: 23,                // 0-50 movimientos
  quality: "good",              // "excellent", "good", "poor"
  startTime: "2024-01-15T16:00:00.000Z",  // Hora de inicio
  endTime: "2024-01-16T23:00:00.000Z"     // Hora de fin
}
```

## Cómo Usar

1. **Generar datos de prueba**:
   - En HomeScreen, presiona "Generar Datos de Prueba"
   - Se crearán 30 días de datos de sueño

2. **Ver estadísticas**:
   - Ve a la pestaña "Explore"
   - Verás el heatmap de 30 días con colores

3. **Ver detalles de un día**:
   - Toca cualquier día en el heatmap (que tenga datos)
   - Se abre un modal con:
     - Stats del día
     - Timeline interactivo de sueño
     - Información detallada

## Próximos Pasos Sugeridos

1. Implementar animaciones en los gráficos
2. Agregar filtros (últimas 2 semanas, mes completo, etc.)
3. Exportar datos (PDF, CSV)
4. Comparativa con promedios personales
5. Metas de sueño personalizadas
