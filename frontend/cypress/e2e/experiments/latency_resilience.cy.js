describe('Experimento IEEE: Resiliencia de UI bajo Latencia Estocástica', () => {
  const markets = ['US', 'CH', 'JP', 'MX'];
  const profiles = ['standard_user', 'performance_glitch_user'];

  profiles.forEach((profile) => {
    context(`Evaluando perfil de inyección: ${profile}`, () => {
      
      markets.forEach((market) => {
        it(`Mide la latencia de renderizado (FID proxy) para el mercado ${market}`, () => {
          
          // 1. Intercept requests to inject the Dynamic Configuration Model
          cy.intercept('**/api/*', (req) => {
            req.headers['X-Country-Code'] = market;
          }).as(`apiCalls_${market}`);

          // 2. Hydration of API-Driven state (Login)
          cy.visit('/login');
          cy.get('[data-test="username"]').type(profile);
          cy.get('[data-test="password"]').type('omnipizza_secret'); 
          cy.get('[data-test="login-button"]').click();

          // 3. Measuring Recovery/Rendering Time
          cy.window().then((win) => {
            const startTime = win.performance.now();

            // Navigate to the checkout, which is the area of greatest variability
            cy.get('[data-test="checkout-link"]').click();

            // Wait for the main market form to be fully interactive
            cy.get('[data-test="checkout-form-container"]', { timeout: 15000 })
              .should('be.visible')
              .then(() => {
                const endTime = win.performance.now();
                const renderLatency = endTime - startTime;

                // 4. Output data for statistical analysis of the paper
                cy.log(`[DATA_POINT] Perfil: ${profile} | Mercado: ${market} | Latencia: ${renderLatency.toFixed(2)} ms`);
                
                // Optional: Write this to a CSV file using cy.writeFile or cy.task
                cy.task('logIEEEData', { 
                  experiment: 'Fuzzy_Wait_States',
                  profile: profile, 
                  market: market, 
                  platform: 'web',
                  latencyMs: renderLatency 
                });
              });
          });
        });
      });
    });
  });
});