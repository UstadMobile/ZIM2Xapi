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

Cypress.Commands.add('interceptAttempted', (expectedActor, expectedVerb) => {
    // Intercepts the "attempted" request and verifies the request body
    cy.intercept('POST', '**/statement/', (req) => {
        if (req.body.verb && req.body.verb.id === 'http://adlnet.gov/expapi/verbs/attempted') {
            // Assertions for the "attempted" statement
            expect(req.body.actor).to.deep.equal(expectedActor);
            expect(req.body.verb.id).to.equal(expectedVerb);

            // Mock response
            req.reply({
                statusCode: 200,
                body: { message: 'Attempted statement received successfully' }
            });
        }
    }).as('attemptedStatement');
});

Cypress.Commands.add('interceptProgress', (expectedActor, expectedVerb) => {
    // Intercepts the "progressed" request and verifies the request body
    cy.intercept('POST', '**/statement/', (req) => {
        if (req.body.verb && req.body.verb.id === 'http://adlnet.gov/expapi/verbs/progressed') {
            // Assertions for the "progressed" statement
            expect(req.body.actor).to.deep.equal(expectedActor);
            expect(req.body.verb.id).to.equal(expectedVerb);

            // Mock response
            req.reply({
                statusCode: 200,
                body: { message: 'Progress statement received successfully' }
            });
        }
    }).as('progressStatement');
});

afterEach(() => {
    cy.task('cleanTempContent')
    .then(() => {
        console.log('Temporary content folder deleted successfully after the test.');
    });
});