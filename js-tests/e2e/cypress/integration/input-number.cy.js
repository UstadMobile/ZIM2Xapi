import { ACTOR, ENDPOINT, AUTH, VERBS, QuestionType } from '../support/constants';

const zimFileName = "input_number";

describe('Input Number Tests', () => {

    before(() => {
        cy.convertZimFile(zimFileName);
      });

    it('completes the input number exercise and verifies all xAPI statements', () => {

        const baseUrl = `${zimFileName}/index.html`

        const queryParams = {
            endpoint: ENDPOINT,
            auth: AUTH,
            registration: 'input-number-registration',
            actor: JSON.stringify(ACTOR)
        };
        const queryString = new URLSearchParams(queryParams).toString();
    
          const expectedContext = {
            registration: "input-number-registration"
          };

          cy.interceptXapiStatement(
            VERBS.ATTEMPTED.id,     
            'attemptedStatement',          
            VERBS.ATTEMPTED,          
            null,
            null,                        
            expectedContext    
          );

        cy.visit(`${baseUrl}?${queryString}`);

        cy.get('body').should('be.visible');

        cy.getxapiobject(zimFileName).then((expectedObject) => {

            cy.wait('@attemptedStatement').then((interception) => {
                const requestBody = interception.request.body;
                
                expect(requestBody.object).to.deep.equal(expectedObject);

            })
        });

          const expectedResult = {
            score: {
              scaled: 1,  
              raw: 15,     
              min: 0,       
              max: 15
            },
            completion: true,
            success: true
          };

          cy.interceptXapiStatement(
            VERBS.COMPLETED.id,
            'completeStatement',
            VERBS.COMPLETED,
            expectedResult
          );

        const questions = [
            { answer: "119", questionNumber: "1" },
            { answer: "105", questionNumber: "2" },
            { answer: "99", questionNumber: "3" },
            { answer: "111", questionNumber: "4" },
            { answer: "101", questionNumber: "5" },
            { answer: "101", questionNumber: "6" },
            { answer: "120", questionNumber: "7" },
            { answer: "108", questionNumber: "8" },
            { answer: "106", questionNumber: "9" },
            { answer: "115", questionNumber: "10" },
            { answer: "118", questionNumber: "11" },
            { answer: "109", questionNumber: "12" },
            { answer: "103", questionNumber: "13" },
            { answer: "104", questionNumber: "14" },
            { answer: "99", questionNumber: "15" },
          ];
      
          // Loop through the array and answer each question
          questions.forEach((question) => {

            const expectedResult = {
                response: question.answer,
                success: true
              };

              const expectedObject = {
                objectType: "Activity",
                definition: {
                  type: "http://adlnet.gov/expapi/activities/cmi.interaction",
                  interactionType: "numeric",
                  correctResponsesPattern: [question.answer]
                }
              };
            
            cy.submitAnswer(QuestionType.INPUT, question.answer, question.questionNumber, questions.length, expectedObject, expectedResult);
          });
          cy.wait(`@completeStatement`).then(intercept => {
            cy.log('Intercepted complete statement');
            expect(intercept.response).to.exist;
            expect(intercept.response.statusCode).to.eq(200);
          })

    });


    it('attempts to fail the input number exercise and verifies failing xAPI statements', () => {

        const baseUrl = `${zimFileName}/index.html`;
    
        // Use the pre-generated temp folder from ZIM conversion
        const queryParams = {
          endpoint: ENDPOINT,
          auth: AUTH,
          registration: 'input-number-registration',
          actor: JSON.stringify(ACTOR)
        };
        const queryString = new URLSearchParams(queryParams).toString();
    
        const expectedContext = {
          registration: "input-number-registration"
        };
    
        cy.interceptXapiStatement(
          VERBS.ATTEMPTED.id,
          'attemptedStatement',
          VERBS.ATTEMPTED,
          null,
          null,
          expectedContext
        );
    
        cy.visit(`${baseUrl}?${queryString}`);
    
        cy.get('body').should('be.visible');
    
        cy.getxapiobject(zimFileName).then((expectedObject) => {
          cy.wait('@attemptedStatement').then((interception) => {
            const requestBody = interception.request.body;
            expect(requestBody.object).to.deep.equal(expectedObject);
          });
        });
    
        const expectedFailResult = {
          score: {
            scaled: 0,
            raw: 0,
            min: 0,
            max: 15
          },
          completion: true,
          success: false
        };
    
        cy.interceptXapiStatement(
          VERBS.COMPLETED.id,
          'completeStatement',
          VERBS.COMPLETED,
          expectedFailResult
        );

        const questions = [
            { incorrectAnswer: "120", answer: "119", questionNumber: "1" },
            { incorrectAnswer: "104", answer: "105", questionNumber: "2" },
            { incorrectAnswer: "100", answer: "99", questionNumber: "3" },
            { incorrectAnswer: "120", answer: "111", questionNumber: "4" },
            { incorrectAnswer: "113", answer: "101", questionNumber: "5" },
            { incorrectAnswer: "105", answer: "101", questionNumber: "6" },
            { incorrectAnswer: "102", answer: "120", questionNumber: "7" },
            { incorrectAnswer: "100", answer: "108", questionNumber: "8" },
            { incorrectAnswer: "99", answer: "106", questionNumber: "9" },
            { incorrectAnswer: "111", answer: "115", questionNumber: "10" },
            { incorrectAnswer: "144", answer: "118", questionNumber: "11" },
            { incorrectAnswer: "11", answer: "109", questionNumber: "12" },
            { incorrectAnswer: "22", answer: "103", questionNumber: "13" },
            { incorrectAnswer: "14", answer: "104", questionNumber: "14" },
            { incorrectAnswer: "15", answer: "99", questionNumber: "15" },
          ];
    
        // Loop through the array and answer each question incorrectly, then correctly
        questions.forEach((question) => {

            const expectedResult = {
                response: question.incorrectAnswer,
                success: false
              };

              const expectedObject = {
                objectType: "Activity",
                definition: {
                  type: "http://adlnet.gov/expapi/activities/cmi.interaction",
                  interactionType: "numeric",
                  correctResponsesPattern: [question.answer]
                }
              };

          // Answer incorrectly first
          cy.submitAnswer(QuestionType.INPUT, question.incorrectAnswer, question.questionNumber, questions.length, expectedObject, expectedResult);
    
          // Then answer correctly
          cy.retryAnswer(QuestionType.INPUT, question.answer, question.questionNumber, questions.length);
        });
        cy.wait(`@completeStatement`).then(intercept => {
          cy.log('Intercepted complete statement');
          expect(intercept.response).to.exist;
          expect(intercept.response.statusCode).to.eq(200);
        })
      });
    

});