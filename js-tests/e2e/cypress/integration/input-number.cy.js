describe('Input Number Tests', () => {

    it('should complete input number interaction and generate xAPI statements', () => {

        const zimFile = "input-number"
        const baseUrl = `${zimFile}/index.html`

        cy.convertZimFile(zimFile);

        const actor = {
            name: ["Project Tin Can"],
            mbox: "mailto:tincan@scorm.com"
        };

        const queryParams = {
            endpoint: 'https://dummy-endpoint.com/lrs/statement/',
            auth: 'dummyAuthToken',
            registration: 'input-number-registration',
            actor: JSON.stringify(actor)
        };
        const queryString = new URLSearchParams(queryParams).toString();
    
        const expectedAttemptedVerb = {
            id: "http://adlnet.gov/expapi/verbs/attempted",
            display: {
              "en": "attempted"
            }
          };
          const expectedContext = {
            registration: "input-number-registration"
          };

        cy.interceptAttempted(actor, expectedAttemptedVerb, expectedContext);

        cy.visit(`${baseUrl}?${queryString}`);

        cy.get('body').should('be.visible');

        cy.getxapiobject(zimFile).then((expectedObject) => {

            cy.wait('@attemptedStatement').then((interception) => {
                const requestBody = interception.request.body;
                
                expect(requestBody.object).to.deep.equal(expectedObject);

            })
        });

        const expectedCompletedVerb = {
            id: "http://adlnet.gov/expapi/verbs/completed",
            display: {
              "en": "completed"
            }
          }; 

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
          cy.interceptExerciseComplete(expectedCompletedVerb, expectedResult)

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
            cy.answerCorrectQuestion(question.answer, question.questionNumber);
          });


          cy.get(`.green-alert-text`).contains("Exercise Complete!")

    });

});