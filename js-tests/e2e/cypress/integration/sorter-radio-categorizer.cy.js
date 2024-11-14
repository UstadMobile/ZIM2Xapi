import { ACTOR, ENDPOINT, AUTH, VERBS, QuestionType } from '../support/constants';

const zimFileName = "sorter";

describe('Sorter Tests', () => {

    before(() => {
        cy.convertZimFile(zimFileName);
    });

    it('completes the multi-interaction exercise and verifies all xAPI statements', () => {

        const baseUrl = `${zimFileName}/index.html`

        const queryParams = {
            endpoint: ENDPOINT,
            auth: AUTH,
            registration: 'sorter-registration',
            actor: JSON.stringify(ACTOR)
        };
        const queryString = new URLSearchParams(queryParams).toString();

        const expectedContext = {
            registration: "sorter-registration"
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
                raw: 5,
                min: 0,
                max: 5
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
            {
                answer: [
                    { text: "Electrons are transferred to molecules in the beginning of the electron transport chain.", targetIndex: 0 },
                    { text: "H+ ions are pumped across the mitochondrial membrane to establish an electrochemical gradient.", targetIndex: 1 },
                    { text: "Electrons are transferred to oxygen, causing it to split and take up H+ ions, which forms water.", targetIndex: 2 },
                    { text: "H+ ions flow down the gradient to generate ATP.", targetIndex: 3 },
                ],
                questionNumber: "1", 
                questionType: QuestionType.SORTER, 
                interactionType: "sequencing",
                response: `choice1[,]choice2[,]choice3[,]choice4`,
            },
            {
                answer: 1,
                questionNumber: "2", 
                questionType: QuestionType.RADIO, 
                interactionType: "choice",
                response: `choice2`,
            },
            {
                answer: 0,
                questionNumber: "3", 
                questionType: QuestionType.RADIO, 
                interactionType: "choice",
                response: `choice1`,
            },
            {
                answer: 0,
                questionNumber: "4", 
                questionType: QuestionType.RADIO, 
                interactionType: "choice",
                response: `choice1`,
            },
            {
                answer: [
                    { text: "Oxidizes NADH to NAD+", targetIndex: 0 }, 
                    { text: "Creates a proton gradient", targetIndex: 0 }, 
                    { text: "Makes ATP using a proton gradient", targetIndex: 1 },
                    { text: "Oxidizes FADH2 to FAD", targetIndex: 0 }
                  ],
                questionNumber: "5", 
                questionType: QuestionType.CATEGORIZER, 
                interactionType: "matching",
                response: `source1[.]target1[,]source2[.]target1[,]source3[.]target2[,]source4[.]target1`,
            }
        ];


        // Loop through the array and answer each question
        questions.forEach((question) => {

            const expectedResult = {
                response: question.response,
                success: true
            };

            const expectedObject = {
                objectType: "Activity",
                definition: {
                    type: "http://adlnet.gov/expapi/activities/cmi.interaction",
                    interactionType: question.interactionType,
                    correctResponsesPattern: [question.response]
                }
            };

            cy.submitAnswer(question.questionType, question.answer, question.questionNumber, questions.length, expectedObject, expectedResult);
        });
        cy.wait('@completeStatement');
       

    });


    it.only('attempts to fail the multi-interaction exercise and verifies failing xAPI statements', () => {

        const baseUrl = `${zimFileName}/index.html`;

        // Use the pre-generated temp folder from ZIM conversion
        const queryParams = {
            endpoint: ENDPOINT,
            auth: AUTH,
            registration: 'sorter-registration',
            actor: JSON.stringify(ACTOR)
        };
        const queryString = new URLSearchParams(queryParams).toString();

        const expectedContext = {
            registration: "sorter-registration"
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
                max: 5
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
            {
                incorrectAnswer: [
                    { text: "H+ ions are pumped across the mitochondrial membrane to establish an electrochemical gradient.", targetIndex: 0 },
                    { text: "Electrons are transferred to molecules in the beginning of the electron transport chain.", targetIndex: 1 },
                    { text: "Electrons are transferred to oxygen, causing it to split and take up H+ ions, which forms water.", targetIndex: 2 },
                    { text: "H+ ions flow down the gradient to generate ATP.", targetIndex: 3 },
                ],
                answer: [
                    { text: "Electrons are transferred to molecules in the beginning of the electron transport chain.", targetIndex: 0 },
                    { text: "H+ ions are pumped across the mitochondrial membrane to establish an electrochemical gradient.", targetIndex: 1 },
                    { text: "Electrons are transferred to oxygen, causing it to split and take up H+ ions, which forms water.", targetIndex: 2 },
                    { text: "H+ ions flow down the gradient to generate ATP.", targetIndex: 3 },
                ],
                questionNumber: "1", 
                questionType: QuestionType.SORTER, 
                interactionType: "sequencing",
                incorrectResponse: `choice2[,]choice1[,]choice3[,]choice4`,
                response: `choice1[,]choice2[,]choice3[,]choice4`,
            },
            {
                incorrectAnswer: 0,
                answer: 1,
                questionNumber: "2", 
                questionType: QuestionType.RADIO, 
                interactionType: "choice",
                incorrectResponse: 'choice1',
                response: `choice2`,
            },
            {
                incorrectAnswer: 1,
                answer: 0,
                questionNumber: "3", 
                questionType: QuestionType.RADIO, 
                interactionType: "choice",
                incorrectResponse: 'choice2',
                response: `choice1`,
            },
            {
                incorrectAnswer: 1,
                answer: 0,
                questionNumber: "4", 
                questionType: QuestionType.RADIO, 
                interactionType: "choice",
                incorrectResponse: 'choice2',
                response: `choice1`,
            },
            {
                incorrectAnswer: [
                    { text: "Oxidizes NADH to NAD+", targetIndex: 1 }, 
                    { text: "Creates a proton gradient", targetIndex: 0 }, 
                    { text: "Makes ATP using a proton gradient", targetIndex: 1 },
                    { text: "Oxidizes FADH2 to FAD", targetIndex: 0 }
                  ],
                answer: [
                    { text: "Oxidizes NADH to NAD+", targetIndex: 0 }, 
                    { text: "Creates a proton gradient", targetIndex: 0 }, 
                    { text: "Makes ATP using a proton gradient", targetIndex: 1 },
                    { text: "Oxidizes FADH2 to FAD", targetIndex: 0 }
                  ],
                questionNumber: "5", 
                questionType: QuestionType.CATEGORIZER, 
                interactionType: "matching",
                incorrectResponse: `source1[.]target2[,]source2[.]target1[,]source3[.]target2[,]source4[.]target1`,
                response: `source1[.]target1[,]source2[.]target1[,]source3[.]target2[,]source4[.]target1`,
            }
        ];

        // Loop through the array and answer each question incorrectly, then correctly
        questions.forEach((question) => {

            const expectedResult = {
                response: question.incorrectResponse,
                success: false
            };

            const expectedObject = {
                objectType: "Activity",
                definition: {
                    type: "http://adlnet.gov/expapi/activities/cmi.interaction",
                    interactionType: question.interactionType,
                    correctResponsesPattern: [question.response]
                }
            };

            // Answer incorrectly first
            cy.submitAnswer(question.questionType, question.incorrectAnswer, question.questionNumber, questions.length, expectedObject, expectedResult);

            // Then answer correctly
            cy.retryAnswer(question.questionType, question.answer, question.questionNumber, questions.length);
        });
        cy.wait('@completeStatement');
    });


});