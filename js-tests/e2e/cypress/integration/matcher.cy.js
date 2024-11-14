import { ACTOR, ENDPOINT, AUTH, VERBS, QuestionType } from '../support/constants';

const zimFileName = "matcher";

describe('Matcher Tests', () => {

    before(() => {
        cy.convertZimFile(zimFileName);
    });

    it('completes the matcher exercise and verifies all xAPI statements', () => {

        const baseUrl = `${zimFileName}/index.html`

        const queryParams = {
            endpoint: ENDPOINT,
            auth: AUTH,
            registration: 'matcher-registration',
            actor: JSON.stringify(ACTOR)
        };
        const queryString = new URLSearchParams(queryParams).toString();

        const expectedContext = {
            registration: "matcher-registration"
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
                raw: 13,
                min: 0,
                max: 13
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
                        { text: "The gym's net worth was at its lowest at", targetIndex: 0 },
                        { text: "The gym's losses exceeded its profits between", targetIndex: 1 },
                        { text: "The gym was losing money for the first", targetIndex: 2 }
                    ], questionNumber: "1"
                },
                {
                    answer: [
                        { text: "At the beginning, the surface's height was", targetIndex: 0 },
                        { text: "The water was at a crest after", targetIndex: 1 },
                        { text: "The surface descended between", targetIndex: 2 }
                    ], questionNumber: "2"
                },
                {
                    answer: [
                        { text: "at the beginning of the day", targetIndex: 0 },
                        { text: "The temperature was above zero", targetIndex: 1 },
                        { text: "It was getting warmer", targetIndex: 2 }
                    ], questionNumber: "3"
                },
                {
                    answer: [
                        { text: "Keith's lowest altitude was", targetIndex: 0 },
                        { text: "Keith was above the ground", targetIndex: 1 },
                        { text: "the elevator was going up", targetIndex: 2 }
                    ], questionNumber: "4"
                },
                {
                    answer: [
                        { text: "The plumber drained all the water out", targetIndex: 0 },
                        { text: "The amount of water reached", targetIndex: 1 },
                        { text: "the leak just got bigger and bigger", targetIndex: 2 }
                    ], questionNumber: "5"
                },
                {
                    answer: [
                        { text: "At sea level, the tree grows by", targetIndex: 0 },
                        { text: "The fastest possible growth rate is", targetIndex: 1 },
                        { text: "the growth rate of the tree declines", targetIndex: 2 }
                    ]
                    , questionNumber: "6"
                },
                {
                    answer: [
                        { text: "The motor loses all efficiency when", targetIndex: 0 },
                        { text: "At its most efficient, the motor uses about", targetIndex: 1 },
                        { text: "the motor becomes less efficient", targetIndex: 2 }
                    
                    ], questionNumber: "7"
                },
                { answer: [
                    { text: "it doesn't consume any fuel", targetIndex: 0 },
                    { text: "The most efficient the car can get is", targetIndex: 1 },
                    { text: "it gets more efficient", targetIndex: 2 },
                ], questionNumber: "8" },
                { answer:[
                    { text: "is virtually undetectable by the human eye", targetIndex: 0 },
                    { text: "The human eye is most sensitive to a wavelength of", targetIndex: 1 },
                    { text: "the human eye becomes less sensitive to it", targetIndex: 2 }
                ] , questionNumber: "9" },
                { answer: [
                    { text: "it has no area", targetIndex: 0 },
                    { text: "The greatest possible area of the rectangle is", targetIndex: 1 },
                    { text: "the area of the rectangle grows", targetIndex: 2 },
                ]
                , questionNumber: "10" },
                { answer: [
                    { text: "Jan threw the javelin to a distance of", targetIndex: 0 },
                    { text: "The highest point the javelin reached was", targetIndex: 1 },
                    { text: "The javelin began its descent", targetIndex: 2 }
                ]
                , questionNumber: "11" },
                { answer:[
                    { text: "The coldest temperature outside the car was", targetIndex: 0 },
                    { text: "the outside temperature was below zero", targetIndex: 1 },
                    { text: "the temperature outside the car got warmer", targetIndex: 2 }
                ]
                , questionNumber: "12" },
                { answer: [
                    { text: "If Jada doesn't sell anything, she loses", targetIndex: 0 },
                    { text: "Jada needs to sell more than", targetIndex: 1 },
                    { text: "The more paprika Jada sells, the more profit she makes", targetIndex: 2 }
                ]
                , questionNumber: "13" },
            ];


        // Loop through the array and answer each question
        questions.forEach((question) => {

            const expectedResult = {
                response: `source1[.]1[,]source2[.]2[,]source3[.]3`,
                success: true
            };

            const expectedObject = {
                objectType: "Activity",
                definition: {
                    type: "http://adlnet.gov/expapi/activities/cmi.interaction",
                    interactionType: "matching",
                    correctResponsesPattern: [`source1[.]1[,]source2[.]2[,]source3[.]3`]
                }
            };

            cy.submitAnswer(QuestionType.MATCHER, question.answer, question.questionNumber, questions.length, expectedObject, expectedResult);
        });
        cy.wait('@completeStatement');

    });


    it('attempts to fail the matcher exercise and verifies failing xAPI statements', () => {

        const baseUrl = `${zimFileName}/index.html`;

        // Use the pre-generated temp folder from ZIM conversion
        const queryParams = {
            endpoint: ENDPOINT,
            auth: AUTH,
            registration: 'matcher-registration',
            actor: JSON.stringify(ACTOR)
        };
        const queryString = new URLSearchParams(queryParams).toString();

        const expectedContext = {
            registration: "matcher-registration"
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
                max: 13
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
                    { text: "The gym's net worth was at its lowest at", targetIndex: 2 },
                    { text: "The gym's losses exceeded its profits between", targetIndex: 0 },
                    { text: "The gym was losing money for the first", targetIndex: 1 }
                ],
                answer: [
                    { text: "The gym's net worth was at its lowest at", targetIndex: 0 },
                    { text: "The gym's losses exceeded its profits between", targetIndex: 1 },
                    { text: "The gym was losing money for the first", targetIndex: 2 }
                ],
                questionNumber: "1"
            },
            {
                incorrectAnswer: [
                    { text: "At the beginning, the surface's height was", targetIndex: 2 },
                    { text: "The water was at a crest after", targetIndex: 0 },
                    { text: "The surface descended between", targetIndex: 1 }
                ],
                answer: [
                    { text: "At the beginning, the surface's height was", targetIndex: 0 },
                    { text: "The water was at a crest after", targetIndex: 1 },
                    { text: "The surface descended between", targetIndex: 2 }
                ],
                questionNumber: "2"
            },
            {
                incorrectAnswer: [
                    { text: "at the beginning of the day", targetIndex: 2 },
                    { text: "The temperature was above zero", targetIndex: 0 },
                    { text: "It was getting warmer", targetIndex: 1 }
                ],
                answer: [
                    { text: "at the beginning of the day", targetIndex: 0 },
                    { text: "The temperature was above zero", targetIndex: 1 },
                    { text: "It was getting warmer", targetIndex: 2 }
                ],
                questionNumber: "3"
            },
            {
                incorrectAnswer: [
                    { text: "Keith's lowest altitude was", targetIndex: 2 },
                    { text: "Keith was above the ground", targetIndex: 0 },
                    { text: "the elevator was going up", targetIndex: 1 }
                ],
                answer: [
                    { text: "Keith's lowest altitude was", targetIndex: 0 },
                    { text: "Keith was above the ground", targetIndex: 1 },
                    { text: "the elevator was going up", targetIndex: 2 }
                ],
                questionNumber: "4"
            },
            {
                incorrectAnswer: [
                    { text: "The plumber drained all the water out", targetIndex: 2 },
                    { text: "The amount of water reached", targetIndex: 0 },
                    { text: "the leak just got bigger and bigger", targetIndex: 1 }
                ],
                answer: [
                    { text: "The plumber drained all the water out", targetIndex: 0 },
                    { text: "The amount of water reached", targetIndex: 1 },
                    { text: "the leak just got bigger and bigger", targetIndex: 2 }
                ],
                questionNumber: "5"
            },
            {
                incorrectAnswer: [
                    { text: "At sea level, the tree grows by", targetIndex: 2 },
                    { text: "The fastest possible growth rate is", targetIndex: 0 },
                    { text: "the growth rate of the tree declines", targetIndex: 1 }
                ],
                answer: [
                    { text: "At sea level, the tree grows by", targetIndex: 0 },
                    { text: "The fastest possible growth rate is", targetIndex: 1 },
                    { text: "the growth rate of the tree declines", targetIndex: 2 }
                ],
                questionNumber: "6"
            },
            {
                incorrectAnswer: [
                    { text: "The motor loses all efficiency when", targetIndex: 2 },
                    { text: "At its most efficient, the motor uses about", targetIndex: 0 },
                    { text: "the motor becomes less efficient", targetIndex: 1 }
                ],
                answer: [
                    { text: "The motor loses all efficiency when", targetIndex: 0 },
                    { text: "At its most efficient, the motor uses about", targetIndex: 1 },
                    { text: "the motor becomes less efficient", targetIndex: 2 }
                ],
                questionNumber: "7"
            },
            {
                incorrectAnswer: [
                    { text: "it doesn't consume any fuel", targetIndex: 2 },
                    { text: "The most efficient the car can get is", targetIndex: 0 },
                    { text: "it gets more efficient", targetIndex: 1 }
                ],
                answer: [
                    { text: "it doesn't consume any fuel", targetIndex: 0 },
                    { text: "The most efficient the car can get is", targetIndex: 1 },
                    { text: "it gets more efficient", targetIndex: 2 }
                ],
                questionNumber: "8"
            },
            {
                incorrectAnswer: [
                    { text: "is virtually undetectable by the human eye", targetIndex: 2 },
                    { text: "The human eye is most sensitive to a wavelength of", targetIndex: 0 },
                    { text: "the human eye becomes less sensitive to it", targetIndex: 1 }
                ],
                answer: [
                    { text: "is virtually undetectable by the human eye", targetIndex: 0 },
                    { text: "The human eye is most sensitive to a wavelength of", targetIndex: 1 },
                    { text: "the human eye becomes less sensitive to it", targetIndex: 2 }
                ],
                questionNumber: "9"
            },
            {
                incorrectAnswer: [
                    { text: "it has no area", targetIndex: 2 },
                    { text: "The greatest possible area of the rectangle is", targetIndex: 0 },
                    { text: "the area of the rectangle grows", targetIndex: 1 }
                ],
                answer: [
                    { text: "it has no area", targetIndex: 0 },
                    { text: "The greatest possible area of the rectangle is", targetIndex: 1 },
                    { text: "the area of the rectangle grows", targetIndex: 2 }
                ],
                questionNumber: "10"
            },
            {
                incorrectAnswer: [
                    { text: "Jan threw the javelin to a distance of", targetIndex: 2 },
                    { text: "The highest point the javelin reached was", targetIndex: 0 },
                    { text: "The javelin began its descent", targetIndex: 1 }
                ],
                answer: [
                    { text: "Jan threw the javelin to a distance of", targetIndex: 0 },
                    { text: "The highest point the javelin reached was", targetIndex: 1 },
                    { text: "The javelin began its descent", targetIndex: 2 }
                ],
                questionNumber: "11"
            },
            {
                incorrectAnswer: [
                    { text: "The coldest temperature outside the car was", targetIndex: 2 },
                    { text: "the outside temperature was below zero", targetIndex: 0 },
                    { text: "the temperature outside the car got warmer", targetIndex: 1 }
                ],
                answer: [
                    { text: "The coldest temperature outside the car was", targetIndex: 0 },
                    { text: "the outside temperature was below zero", targetIndex: 1 },
                    { text: "the temperature outside the car got warmer", targetIndex: 2 }
                ],
                questionNumber: "12"
            },
            {
                incorrectAnswer: [
                    { text: "If Jada doesn't sell anything, she loses", targetIndex: 2 },
                    { text: "Jada needs to sell more than", targetIndex: 0 },
                    { text: "The more paprika Jada sells, the more profit she makes", targetIndex: 1 }
                ],
                answer: [
                    { text: "If Jada doesn't sell anything, she loses", targetIndex: 0 },
                    { text: "Jada needs to sell more than", targetIndex: 1 },
                    { text: "The more paprika Jada sells, the more profit she makes", targetIndex: 2 }
                ],
                questionNumber: "13"
            }
        ];
        

        // Loop through the array and answer each question incorrectly, then correctly
        questions.forEach((question) => {

            const expectedResult = {
                response: `source1[.]2[,]source2[.]3[,]source3[.]1`,
                success: false
            };

            const expectedObject = {
                objectType: "Activity",
                definition: {
                    type: "http://adlnet.gov/expapi/activities/cmi.interaction",
                    interactionType: "matching",
                    correctResponsesPattern: [`source1[.]1[,]source2[.]2[,]source3[.]3`]
                }
            };

            // Answer incorrectly first
            cy.submitAnswer(QuestionType.MATCHER, question.incorrectAnswer, question.questionNumber, questions.length, expectedObject, expectedResult);

            // Then answer correctly
            cy.retryAnswer(QuestionType.MATCHER, question.answer, question.questionNumber, questions.length);
        });
        cy.wait('@completeStatement');
    });


});
