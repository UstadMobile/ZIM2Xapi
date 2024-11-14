import { ACTOR, ENDPOINT, AUTH, VERBS, QuestionType } from '../support/constants';

const zimFileName = "dropdown";

describe('Dropdown Tests', () => {

    before(() => {
        cy.convertZimFile(zimFileName);
    });

    it('completes the dropdown exercise and verifies all xAPI statements', () => {

        const baseUrl = `${zimFileName}/index.html`

        const queryParams = {
            endpoint: ENDPOINT,
            auth: AUTH,
            registration: 'dropdown-registration',
            actor: JSON.stringify(ACTOR)
        };
        const queryString = new URLSearchParams(queryParams).toString();

        const expectedContext = {
            registration: "dropdown-registration"
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
                raw: 22,
                min: 0,
                max: 22
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
            { answer: "1", questionNumber: "1" },
            { answer: "1", questionNumber: "2" },
            { answer: "1", questionNumber: "3" },
            { answer: "1", questionNumber: "4" },
            { answer: "1", questionNumber: "5" },
            { answer: "1", questionNumber: "6" },
            { answer: "1", questionNumber: "7" },
            { answer: "1", questionNumber: "8" },
            { answer: "2", questionNumber: "9" },
            { answer: "2", questionNumber: "10" },
            { answer: "2", questionNumber: "11" },
            { answer: "2", questionNumber: "12" },
            { answer: "2", questionNumber: "13" },
            { answer: "2", questionNumber: "14" },
            { answer: "2", questionNumber: "15" },
            { answer: "2", questionNumber: "16" },
            { answer: "2", questionNumber: "17" },
            { answer: "3", questionNumber: "18" },
            { answer: "3", questionNumber: "19" },
            { answer: "3", questionNumber: "20" },
            { answer: "3", questionNumber: "21" },
            { answer: "3", questionNumber: "22" }
        ];
        

        // Loop through the array and answer each question
        questions.forEach((question) => {

            const expectedResult = {
                response: `choice${question.answer}`,
                success: true
            };

            const expectedObject = {
                objectType: "Activity",
                definition: {
                    type: "http://adlnet.gov/expapi/activities/cmi.interaction",
                    interactionType: "choice",
                    correctResponsesPattern: [`choice${question.answer}`]
                }
            };

            cy.submitAnswer(QuestionType.DROPDOWN, question.answer, question.questionNumber, questions.length, expectedObject, expectedResult);
        });
        cy.wait('@completeStatement');

    });


    it('attempts to fail the dropdown exercise and verifies failing xAPI statements', () => {

        const baseUrl = `${zimFileName}/index.html`;

        // Use the pre-generated temp folder from ZIM conversion
        const queryParams = {
            endpoint: ENDPOINT,
            auth: AUTH,
            registration: 'dropdown-registration',
            actor: JSON.stringify(ACTOR)
        };
        const queryString = new URLSearchParams(queryParams).toString();

        const expectedContext = {
            registration: "dropdown-registration"
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
                max: 22
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
            { incorrectAnswer: "2", answer: "1", questionNumber: "1" },
            { incorrectAnswer: "2", answer: "1", questionNumber: "2" },
            { incorrectAnswer: "3", answer: "1", questionNumber: "3" },
            { incorrectAnswer: "3", answer: "1", questionNumber: "4" },
            { incorrectAnswer: "2", answer: "1", questionNumber: "5" },
            { incorrectAnswer: "3", answer: "1", questionNumber: "6" },
            { incorrectAnswer: "3", answer: "1", questionNumber: "7" },
            { incorrectAnswer: "2", answer: "1", questionNumber: "8" },
            { incorrectAnswer: "1", answer: "2", questionNumber: "9" },
            { incorrectAnswer: "3", answer: "2", questionNumber: "10" },
            { incorrectAnswer: "1", answer: "2", questionNumber: "11" },
            { incorrectAnswer: "3", answer: "2", questionNumber: "12" },
            { incorrectAnswer: "1", answer: "2", questionNumber: "13" },
            { incorrectAnswer: "3", answer: "2", questionNumber: "14" },
            { incorrectAnswer: "1", answer: "2", questionNumber: "15" },
            { incorrectAnswer: "3", answer: "2", questionNumber: "16" },
            { incorrectAnswer: "1", answer: "2", questionNumber: "17" },
            { incorrectAnswer: "1", answer: "3", questionNumber: "18" },
            { incorrectAnswer: "2", answer: "3", questionNumber: "19" },
            { incorrectAnswer: "1", answer: "3", questionNumber: "20" },
            { incorrectAnswer: "2", answer: "3", questionNumber: "21" },
            { incorrectAnswer: "1", answer: "3", questionNumber: "22" }
        ];        

        // Loop through the array and answer each question incorrectly, then correctly
        questions.forEach((question) => {

            const expectedResult = {
                response: `choice${question.incorrectAnswer}`,
                success: false
            };

            const expectedObject = {
                objectType: "Activity",
                definition: {
                    type: "http://adlnet.gov/expapi/activities/cmi.interaction",
                    interactionType: "choice",
                    correctResponsesPattern: [`choice${question.answer}`]
                }
            };

            // Answer incorrectly first
            cy.submitAnswer(QuestionType.DROPDOWN, question.incorrectAnswer, question.questionNumber, questions.length, expectedObject, expectedResult);

            // Then answer correctly
            cy.retryAnswer(QuestionType.DROPDOWN, question.answer, question.questionNumber, questions.length);
        });
        cy.wait('@completeStatement');
    });


});