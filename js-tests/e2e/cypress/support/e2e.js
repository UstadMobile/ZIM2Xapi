// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

const path = require('path');

Cypress.Commands.add('convertZimFile', (zimFileName) => {

    const jarPath = path.join('build','libs','zim2xapi.jar');
    const outputFolder = path.join('e2e', 'temp-content');
    const inputFile = path.join('e2e', 'content', `${zimFileName}.zim`);

    const command = `java -jar ${jarPath} convert -zim-file ${inputFile} -output ${outputFolder}`;
    
    cy.exec(command)
    .its('code')
    .should('eq', 0)
});

afterEach(() => {
    cy.task('cleanTempContent')
    .then(() => {
        console.log('Temporary content folder deleted successfully after the test.');
    });
});