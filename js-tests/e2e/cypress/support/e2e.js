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

Cypress.Commands.add('getxapiobject', (zimFileName) => {

    cy.request(`${zimFileName}/xapiobject.json`).then((response) => {
        return response.body;
    })

})


Cypress.Commands.add('interceptAttempted', (expectedActor, expectedVerb, expectedContext) => {
    // Intercepts the "attempted" request and verifies the request body
    cy.intercept('POST', '**/statement/', (req) => {

    if (req.body.verb.id === 'http://adlnet.gov/expapi/verbs/attempted') {

        expect(req.body.actor).to.deep.equal(expectedActor);
        expect(req.body.verb).to.deep.equal(expectedVerb);
        expect(req.body.context).to.deep.equal(expectedContext);
            // Mock response
        req.reply({
            statusCode: 200,
            body: { message: 'Attempted statement received successfully' }
        });

    }
    
    }).as('attemptedStatement');
});

Cypress.Commands.add('interceptProgress', (expectedVerb, expectedResult, expectedObject) => {
    // Intercepts the "progressed" request and verifies the request body
    cy.intercept('POST', '**/statement/', (req) => {

        if (req.body.verb.id === 'http://adlnet.gov/expapi/verbs/progressed') {

            expect(req.body.verb).to.deep.equal(expectedVerb);
            expect(req.body.result).to.deep.include(expectedResult);
            expect(req.body.object).to.deep.include(expectedObject);

            // Mock response
            req.reply({
                statusCode: 200,
                body: { message: 'Progress statement received successfully' }            
            });

        }
    }).as('progressStatement');
});

Cypress.Commands.add("interceptExerciseComplete", (expectedVerb, expectedResult) => {

    cy.intercept('POST', '**/statement/', (req) => {

        if(req.body.verb.id === "http://adlnet.gov/expapi/verbs/completed"){

            expect(req.body.verb).to.deep.equal(expectedVerb);
            expect(req.body.result).to.deep.include(expectedResult);
    
            req.reply({
                statusCode: 200,
                body: { message: 'Progress statement received successfully' }            
            });
        }

    }).as("completeStatement")

});

Cypress.Commands.add('answerCorrectQuestion', (answer, questionNumber) => {

    const expectedProgressedVerb = {
        id: "http://adlnet.gov/expapi/verbs/progressed",
        display: {
          "en": "progressed"
        }
    }; 

    const expectedResult = {
        response: answer,
        success: true
      };

      const expectedObject = {
        objectType: "Activity",
        definition: {
          type: "http://adlnet.gov/expapi/activities/cmi.interaction",
          interactionType: "numeric",
          correctResponsesPattern: [answer]
        }
      };

    cy.interceptProgress(expectedProgressedVerb, expectedResult, expectedObject);

    cy.get(`#question-status > div`).contains(`Question: ${questionNumber} / 15`)
    cy.get(`.perseus-input`).type(answer)
    cy.get(`.checkanswer-btn`).click()
    cy.contains('button', 'Next Question').click();

    cy.wait('@progressStatement');
});

afterEach(() => {
    cy.task('cleanTempContent')
    .then(() => {
        console.log('Temporary content folder deleted successfully after the test.');
    });
});