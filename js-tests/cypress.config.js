const { defineConfig } = require("cypress");
const fs = require('fs-extra');
const path = require('path');

module.exports = defineConfig({
  video: true,
  e2e: {
    specPattern: 'e2e/cypress/integration/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'e2e/cypress/support/e2e.js',
    baseUrl: 'http://localhost:8082',
    chromeWebSecurity: false,
    reporter: 'mocha-junit-reporter', //refer here for report options: https://www.npmjs.com/package/mocha-junit-reporter#full-configuration-options
            reporterOptions: {
                mochaFile: 'e2e/cypress/results/my-test-output-.[hash].xml',
                testsuitesTitle: true,
                suiteFilename: true,
                suiteTitleSeparatedBy: '.',   // suites separator, default is space (' '), or period ('.') in jenkins mode
                jenkinsMode: true,
                toConsole: false
            },
   
    setupNodeEvents(on, config) {
      // implement node event listeners here

            on('before:run', () => {
                   const tempFolderPath = path.join('e2e', 'temp-content');
                   return fs.emptyDir(tempFolderPath)
                     .then(() => {
                       console.log('Temporary content folder cleaned before all tests.');
                       return null;
                     })
                     .catch((err) => {
                       console.error('Error cleaning temp content folder:', err);
                       return null;
                     });
                 });
          return config;

    },
    screenshotsFolder: 'e2e/cypress/screenshots', // Custom path for screenshots
    videosFolder: 'e2e/cypress/videos',  // Custom path for videos
  },
});
