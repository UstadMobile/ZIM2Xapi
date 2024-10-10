describe('Input Number Tests', () => {

    it('should complete input number interaction and generate xAPI statements', () => {

        const zimFile = "input-number"

        cy.convertZimFile(zimFile);

        cy.visit(`${zimFile}/index.html`);

        cy.get('body').should('be.visible');

    });

});