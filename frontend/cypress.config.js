const { defineConfig } = require("cypress");

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
});
