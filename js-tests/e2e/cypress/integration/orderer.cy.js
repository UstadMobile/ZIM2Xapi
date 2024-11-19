import { ACTOR, ENDPOINT, AUTH, VERBS, QuestionType } from '../support/constants';

const zimFileName = "orderer";

describe('Orderer Tests', () => {

    before(() => {
        cy.convertZimFile(zimFileName);
    });

    it('completes the orderer exercise and verifies all xAPI statements', () => {

        const baseUrl = `${zimFileName}/index.html`

        const queryParams = {
            endpoint: ENDPOINT,
            auth: AUTH,
            registration: 'orderer-registration',
            actor: JSON.stringify(ACTOR)
        };
        const queryString = new URLSearchParams(queryParams).toString();

        const expectedContext = {
            registration: "orderer-registration"
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
                raw: 20,
                min: 0,
                max: 20
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
            { answer: 4, questionNumber: "1" },
            { answer: 6, questionNumber: "2" },
            { answer: 2, questionNumber: "3" },
            { answer: 8, questionNumber: "4" },
            { answer: 10, questionNumber: "5" },
            { answer: 3, questionNumber: "6" },
            { answer: 7, questionNumber: "7" },
            { answer: 5, questionNumber: "8" },
            { answer: 5, questionNumber: "9" },
            { answer: 10, questionNumber: "10" },
            { answer: 2, questionNumber: "11" },
            { answer: 3, questionNumber: "12" },
            { answer: 9, questionNumber: "13" },
            { answer: 4, questionNumber: "14" },
            { answer: 8, questionNumber: "15" },
            { answer: 7, questionNumber: "16" },
            { answer: 9, questionNumber: "17" },
            { answer: 5, questionNumber: "18" },
            { answer: 4, questionNumber: "19" },
            { answer: 6, questionNumber: "20" },
        ];

        // Loop through the array and answer each question
        questions.forEach((question) => {

            const expectedResult = {
                response: createChoiceString(question.answer),
                success: true
            };

            const expectedObject = {
                objectType: "Activity",
                definition: {
                    type: "http://adlnet.gov/expapi/activities/cmi.interaction",
                    interactionType: "sequencing",
                    correctResponsesPattern: [createChoiceString(question.answer)]
                }
            };

            cy.submitAnswer(QuestionType.DRAG_AND_DROP, question.answer, question.questionNumber, questions.length, expectedObject, expectedResult);
        });
        cy.wait(`@completeStatement`).then(intercept => {
            cy.log('Intercepted complete statement');
            expect(intercept.response).to.exist;
            expect(intercept.response.statusCode).to.eq(200);
          })
       
    });


    it('attempts to fail the orderer exercise and verifies failing xAPI statements', () => {

        const baseUrl = `${zimFileName}/index.html`;

        // Use the pre-generated temp folder from ZIM conversion
        const queryParams = {
            endpoint: ENDPOINT,
            auth: AUTH,
            registration: 'orderer-registration',
            actor: JSON.stringify(ACTOR)
        };
        const queryString = new URLSearchParams(queryParams).toString();

        const expectedContext = {
            registration: "orderer-registration"
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
                max: 20
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
            { incorrectAnswer: 1, answer: 4, questionNumber: "1" },
            { incorrectAnswer: 1, answer: 6, questionNumber: "2" },
            { incorrectAnswer: 1, answer: 2, questionNumber: "3" },
            { incorrectAnswer: 1, answer: 8, questionNumber: "4" },
            { incorrectAnswer: 1, answer: 10, questionNumber: "5" },
            { incorrectAnswer: 1, answer: 3, questionNumber: "6" },
            { incorrectAnswer: 1, answer: 7, questionNumber: "7" },
            { incorrectAnswer: 1, answer: 5, questionNumber: "8" },
            { incorrectAnswer: 1, answer: 5, questionNumber: "9" },
            { incorrectAnswer: 1, answer: 10, questionNumber: "10" },
            { incorrectAnswer: 1, answer: 2, questionNumber: "11" },
            { incorrectAnswer: 1, answer: 3, questionNumber: "12" },
            { incorrectAnswer: 1, answer: 9, questionNumber: "13" },
            { incorrectAnswer: 1, answer: 4, questionNumber: "14" },
            { incorrectAnswer: 1, answer: 8, questionNumber: "15" },
            { incorrectAnswer: 1, answer: 7, questionNumber: "16" },
            { incorrectAnswer: 1, answer: 9, questionNumber: "17" },
            { incorrectAnswer: 1, answer: 5, questionNumber: "18" },
            { incorrectAnswer: 1, answer: 4, questionNumber: "19" },
            { incorrectAnswer: 1, answer: 6, questionNumber: "20" },
        ];

        // Loop through the array and answer each question incorrectly, then correctly
        questions.forEach((question) => {

            const expectedResult = {
                response: createChoiceString(question.incorrectAnswer),
                success: false
            };

            const expectedObject = {
                objectType: "Activity",
                definition: {
                    type: "http://adlnet.gov/expapi/activities/cmi.interaction",
                    interactionType: "sequencing",
                    correctResponsesPattern: [createChoiceString(question.answer)]
                }
            };

            // Answer incorrectly first
            cy.submitAnswer(QuestionType.DRAG_AND_DROP, question.incorrectAnswer, question.questionNumber, questions.length, expectedObject, expectedResult);

            // Then answer correctly
            cy.retryAnswer(QuestionType.DRAG_AND_DROP, question.answer, question.questionNumber, questions.length);
        });
        cy.wait(`@completeStatement`).then(intercept => {
            cy.log('Intercepted complete statement');
            expect(intercept.response).to.exist;
            expect(intercept.response.statusCode).to.eq(200);
          })
    });


});

function createChoiceString(number) {
    return Array(number).fill('choice1').join('[,]');
}