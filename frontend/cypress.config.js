const { defineConfig } = require("cypress");
const fs = require('fs');
const path = require('path');

module.exports = defineConfig({
  video: false,
  allowCypressEnv: false,
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
    specPattern: "cypress/component/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/component.js",
    indexHtmlFile: "cypress/support/component-index.html",
  },
  e2e: {
    setupNodeEvents(on, config) {
      // Register the task in Node events
      on('task', {
        logIEEEData({ experiment, profile, market, platform, latencyMs }) {
          // Format the CSV line
          const timestamp = new Date().toISOString();
          const csvLine = `${timestamp},${experiment},${profile},${market},${platform},${latencyMs.toFixed(2)}\n`;
          
          // Define the output path
          const resultsDir = path.join(__dirname, 'cypress', 'results');
          const filePath = path.join(resultsDir, 'ieee_latency_data.csv');

          // Create the directory if it doesn't exist
          if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
          }

          // Create the file and headers if it's the first execution
          if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, 'timestamp,experiment,profile,market,platform,latency_ms\n');
          }

          // Append the new metric to the file
          fs.appendFileSync(filePath, csvLine);
          
          // Cypress requires tasks to return null if there is no return value
          return null; 
        },
      });
    },
  },
});
