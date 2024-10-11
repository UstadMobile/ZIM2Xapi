import { xapiConfig } from "../../../../app/src/main/resources/score-tracker";

describe('Input Number Tests', () => {

    it('should complete input number interaction and generate xAPI statements', () => {

        const zimFile = "input-number"
        const baseUrl = `${zimFile}/index.html`

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
        cy.convertZimFile(zimFile);

        const attemptedVerb = 'http://adlnet.gov/expapi/verbs/attempted';
        const progressedVerb = 'http://adlnet.gov/expapi/verbs/progressed';

        // Step 3: Use custom commands to intercept the "attempted" and "progress" xAPI requests
        cy.interceptAttempted(actor, attemptedVerb);
        cy.interceptProgress(actor, progressedVerb);

        cy.visit(`${baseUrl}?${queryString}`);

        cy.get('body').should('be.visible');

        cy.wait('@attemptedStatement').its('response.statusCode').should('eq', 200);

    });

});