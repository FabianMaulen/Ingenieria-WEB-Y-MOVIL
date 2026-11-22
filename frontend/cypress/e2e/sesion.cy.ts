describe('Baúl Eterno — Sesión y Consulta Familiar', () => {
  it('muestra error al ingresar credenciales incorrectas y no guarda token', () => {
    cy.visit('/login');
    cy.get('#login-id').type('noexiste@bauleterno.cl');
    cy.get('#login-pass').type('ClaveIncorrecta99');
    cy.contains('button[type="submit"]', 'Abrir mi Baúl').click();

    cy.contains('Credenciales inválidas').should('be.visible');
    cy.window().its('localStorage').invoke('getItem', 'auth_token').should('be.null');
  });

  it('permite acceder a la Consulta Familiar desde el login y valida RUT inválido', () => {
    cy.visit('/login');
    cy.contains('¿Buscas el baúl de un familiar fallecido?').click();
    cy.url().should('include', '/consulta-familiar');
    cy.get('input[placeholder*="12345678"]').type('12345678-9');
    cy.contains('button[type="submit"]', 'Consultar existencia de baúl').click();
    cy.contains(/RUT chileno válido/i).should('be.visible');
  });
});
