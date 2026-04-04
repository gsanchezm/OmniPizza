const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

describe('Experimento IEEE: Resiliencia de UI bajo Latencia Estocástica', () => {
  const markets = ['US', 'CH', 'JP', 'MX'];
  const profiles = ['standard_user', 'performance_glitch_user'];

  // Función síncrona para asegurar escritura thread-safe durante la inyección en parallel
  const logIEEEData = (experiment, profile, market, platform, latencyMs) => {
    const timestamp = new Date().toISOString();
    const csvLine = `${timestamp},${experiment},${profile},${market},${platform},${latencyMs.toFixed(2)}\n`;
          
    // Escribe métricas en la carpeta principal compartida con cypress
    const resultsDir = path.join(__dirname, '..', '..', '..', 'frontend', 'cypress', 'results');
    const filePath = path.join(resultsDir, 'ieee_latency_data.csv');

    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, 'timestamp,experiment,profile,market,platform,latency_ms\n');
    }

    // sync flag asegura write operations en caso que estemos integrando CI paralelismo multihilo
    fs.appendFileSync(filePath, csvLine);
  };

  profiles.forEach((profile) => {
    describe(`Evaluando perfil de inyección: ${profile}`, () => {
      
      markets.forEach((market) => {
        it(`Mide la latencia de renderizado para el mercado ${market}`, async () => {
          
          await device.launchApp({
            newInstance: true,
            launchArgs: { detoxCountryCode: market }
          });

          // 1. API-Driven State Hydration (Login automatizado)
          await waitFor(element(by.id('screen-login'))).toBeVisible().withTimeout(15000);

          await element(by.id('input-username')).typeText(profile);
          await element(by.id('input-password')).typeText('pizza123'); // Preset estándar para dev/qa
          
          // Prevenir keyboard occlusion si la pantalla fue renderizada pequeña
          // Para asegurar consistencia de touch actions en iOS/Android
          await element(by.id('btn-login')).tap();

          // Espera a que estemos dentro de la app (Ej: visualización del View container de catálogo o bottom nav)
          await waitFor(element(by.id('view-bottom-nav'))).toBeVisible().withTimeout(15000);
          
          // 2. Medición precisa de FID proxy en el Checkout Container
          const startTime = performance.now();
          
          await element(by.id('nav-checkout')).tap();

          // Espera a que complete el mount cycle del market checkout respectivo
          await waitFor(element(by.id('screen-checkout'))).toBeVisible().withTimeout(15000);
          
          const endTime = performance.now();
          const renderLatency = endTime - startTime;
          
          console.log(`[DATA_POINT] Perfil: ${profile} | Mercado: ${market} | Latencia: ${renderLatency.toFixed(2)} ms`);
          
          // 3. Escribir resultados adjuntando platform: 'mobile'
          logIEEEData('Fuzzy_Wait_States', profile, market, 'mobile', renderLatency);
        });
      });
    });
  });
});
