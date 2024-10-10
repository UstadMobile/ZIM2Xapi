const { defineConfig } = require("cypress");
const fs = require('fs-extra');
const path = require('path');

module.exports = defineConfig({
  e2e: {
    specPattern: 'e2e/cypress/integration/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'e2e/cypress/support/e2e.js',
    baseUrl: 'http://localhost:8081',
   
    setupNodeEvents(on, config) {
      // implement node event listeners here

      on('task', {
              cleanTempContent() {
                  const tempFolderPath = path.join('e2e','temp-content');

                  return fs.emptyDir(tempFolderPath)
                      .then(() => {
                          console.log('Temporary content folder deleted successfully.');
                          return null;
                      })
                      .catch((err) => {
                          console.error('Error deleting temporary content folder:', err);
                          return null;
                      });
              }
          });

          return config;

    },
    screenshotsFolder: 'e2e/cypress/screenshots', // Custom path for screenshots
    videosFolder: 'e2e/cypress/videos',           // Custom path for videos
  },
});
