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

   cy.exec(command, { failOnNonZeroExit: false })  // Prevent immediate failure
      .then((result) => {
        if (result.code !== 0) {
            cy.log(`Command failed: ${result.stderr || 'Unknown error'}`);
        }
        console.log('Command output:', result.stdout);  // Log stdout for additional context
        expect(result.code).to.equal(0);  // This will fail the test and display the error
      });
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
    case QuestionType.DROPDOWN:
      cy.get('.perseus-widget-dropdown').select(answer);
      break;
    case QuestionType.SORTER:
      sortElementsToTargetPosition('.perseus-sortable-draggable',answer);
      break;
    case QuestionType.MATCHER:
          // Loop over each item in target order
        sortElementsToTargetPosition('td:nth-child(2) .perseus-sortable-draggable',answer);
      break;
    case QuestionType.CATEGORIZER:
      answer.forEach(({ text, targetIndex }) => {
        selectCircle(text, targetIndex);
      });
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
    case QuestionType.DROPDOWN:
      cy.get('.perseus-widget-dropdown').select(answer);
      break;
    case QuestionType.SORTER:
      sortElementsToTargetPosition('.perseus-sortable-draggable',answer);
      break;
    case QuestionType.MATCHER:
      // Loop over each item in target order
      sortElementsToTargetPosition('td:nth-child(2) .perseus-sortable-draggable',answer);
    break;
    case QuestionType.CATEGORIZER:
      answer.forEach(({ text, targetIndex }) => {
        selectCircle(text, targetIndex);
      });
    break;
  }
  cy.get(`.checkanswer-btn`).click();

  // Assert that no xAPI statement is sent during retry
  cy.wait(300); // Give some time for any unexpected requests to potentially be sent
  cy.get(`@progressStatement-${questionNumber}.all`).should('have.length', 1) // Length should be 1 from the initial submission only

  cy.contains('button', 'Next Question').click();

});

/**
 * Recursively sorts elements in a draggable list to their target positions.
 * It continually checks each element's position and adjusts if they are out of order, 
 * handling randomized lists where elements might change positions dynamically.
 */
function sortElementsToTargetPosition(elementToMove, answer) {
  let changesMade = false; // Track if any changes are made

  answer.forEach(({ text, targetIndex }) => {
    cy.contains(elementToMove, text)
      .then($el => {
        const currentIndex = $el.index();

        cy.log(`Checking element "${text}": Current Index = ${currentIndex}, Target Index = ${targetIndex}`);

        if (currentIndex !== targetIndex) {
          changesMade = true; // Mark that a change is needed
          cy.contains(elementToMove,text)
            .drag(elementToMove, { index: targetIndex })
            .then(() => {
              // Log confirmation of the move
              cy.log(`Moved "${text}" from index ${currentIndex} to ${targetIndex}`);
            });
        }
      });
  });

  // After each loop, recursively check if changes are still needed
  cy.wait(250).then(() => {
    if (changesMade) {
      cy.log('Re-checking due to detected changes...');
      // Run the function again if there were any movements
      sortElementsToTargetPosition(elementToMove, answer);
    }else {
      cy.log('No changes needed, sorting complete.');
    }
  });
}

// categorizer selector
const selectCircle = (text, targetIndex) => {
  // Locate the row by text
  cy.contains('td', text)
    .parent() // Get the parent row of the located cell
    .within(() => {
      // Select the appropriate column by targetIndex (0 for first column, 1 for second column, etc.)
      cy.get('td')
        .eq(targetIndex + 1) // Adjust for the column index (skip the first column with text)
        .find('.radioSpan_12gpsbj, .radioSpan_12gpsbj-o_O-checkedRadioSpan_9p8gsy') // Select the radio circle
        .click(); // Click the circle
    });
};



/*
  for sorter when need to sort images
   cy.get('.perseus-sortable-draggable img[src*="' + src + '"]')
          .parents('.perseus-sortable-draggable')
          .then($el => {
            const currentIndex = $el.index(); // Get current index of the image
  
            if (currentIndex !== targetIndex) {
              // If the image isn't already in the correct position, move it
              cy.get('.perseus-sortable-draggable')
                .eq(currentIndex)
                .drag('.perseus-sortable-draggable', { index: targetIndex });
            }
          });
      });

      */