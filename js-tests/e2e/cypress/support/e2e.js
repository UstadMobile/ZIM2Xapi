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
import { VERBS, QuestionType } from './constants';
import '@4tw/cypress-drag-drop';


Cypress.Commands.add('convertZimFile', (zimFileName) => {

  const jarPath = path.join('build', 'libs', 'zim2xapi.jar');
  const outputFolder = path.join('e2e', 'temp-content');
  const inputFile = path.join('e2e', 'content', `${zimFileName}.zim`);

  const command = `java -jar ${jarPath} convert -zim-file ${inputFile} -keep-temp -output ${outputFolder}`;

  cy.exec(command)
    .its('code')
    .should('eq', 0)
});

Cypress.Commands.add('getxapiobject', (zimFileName) => {
  return cy.request(`${zimFileName}/xapiobject.json`).then((response) => {
    return response.body;
  });
});


Cypress.Commands.add('interceptXapiStatement', (verb, alias, expectedVerb, expectedResult = null, expectedObject = null, expectedContext = null) => {
  cy.intercept('POST', '**/statements', (req) => {
    if (req.body.verb.id === verb) {
      req.alias = alias
      expect(req.body.verb).to.deep.equal(expectedVerb);
      if (expectedResult) {
        expect(req.body.result).to.deep.include(expectedResult);
      }
      if (expectedObject) {
        Object.keys(expectedObject).forEach((key) => {
          expect(req.body.object[key]).to.deep.include(expectedObject[key]);
        });
      }
      if (expectedContext) {
        expect(req.body.context).to.deep.include(expectedContext)
      }
      req.reply({
        statusCode: 200,
        body: { message: `${verb} statement received successfully` }
      });
    }
  })
});

Cypress.Commands.add('submitAnswer', (questionType, answer, questionNumber, numberOfQuestions, expectedObject, expectedResult) => {

  cy.interceptXapiStatement(
    VERBS.ANSWERED.id,
    `progressStatement-${questionNumber}`,
    VERBS.ANSWERED,
    expectedResult,
    expectedObject
  );

  cy.get(`#question-status > div`).contains(`Question: ${questionNumber} / ${numberOfQuestions}`)

  switch (questionType) {
    case QuestionType.INPUT:
      cy.get(`.perseus-input`).type(answer)
      break;
    case QuestionType.DRAG_AND_DROP:
      for (let i = 0; i < answer; i++) {
        cy.get('.bank .card-wrap.perseus-interactive img')
          .first() // Select the first instance
          .click({ force: true }) // Click with force to ensure it registers
          // Now drag the image
          .drag('.draggable-box', { force: true }); // Use force for the drag
        cy.get('.draggable-box').click({ force: true }).wait(250)
      }
      break;
    case QuestionType.RADIO:
      cy.get('.perseus-radio-option').eq(answer).click();
      break;

  }

  cy.get(`.checkanswer-btn`).click()

  if (expectedResult.success) {
    cy.contains('button', 'Next Question').click();
  }

  cy.wait(`@progressStatement-${questionNumber}`).then(intercept => {
    expect(intercept.response).to.exist;
    expect(intercept.response.statusCode).to.eq(200);
  })
});

Cypress.Commands.add('retryAnswer', (questionType, answer, questionNumber) => {

  switch (questionType) {
    case QuestionType.INPUT:
      cy.get(`.perseus-input`).clear().type(answer)
      break;
    case QuestionType.DRAG_AND_DROP:
      for (let i = 0; i < (answer - 1); i++) {
        cy.get('.bank .card-wrap.perseus-interactive img')
          .first() // Select the first instance
          .click({ force: true }) // Click with force to ensure it registers

          // Now drag the image
          .drag('.draggable-box', { force: true }); // Use force for the drag
        cy.get('.draggable-box').click({ force: true }).wait(200)
      }
      break;
    case QuestionType.RADIO:
      cy.get('.perseus-radio-option').eq(answer).click();
      break;
  }
  cy.get(`.checkanswer-btn`).click();

  // Assert that no xAPI statement is sent during retry
  cy.wait(300); // Give some time for any unexpected requests to potentially be sent
  cy.get(`@progressStatement-${questionNumber}.all`).should('have.length', 1) // Length should be 1 from the initial submission only

  cy.contains('button', 'Next Question').click();

});


// cleans up after all tests complete
after(() => {
  cy.task('cleanTempContent')
    .then(() => {
      console.log('Temporary content folder deleted successfully after the test.');
    });
});