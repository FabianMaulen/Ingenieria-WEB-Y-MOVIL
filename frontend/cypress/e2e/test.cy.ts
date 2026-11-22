describe('Baúl Eterno — Acceso inicial y rutas públicas', () => {
  it('redirige al inicio de sesión cuando no existe una sesión activa', () => {
    cy.visit('/');
    cy.url().should('include', '/login');
    cy.contains('Abre tu Baúl').should('be.visible');
    cy.contains('Continuar con Google').should('be.visible');
  });

  it('permite navegar al flujo de recuperación de contraseña y volver al login', () => {
    cy.visit('/login');
    cy.contains('¿Olvidaste tu contraseña?').click();
    cy.url().should('include', '/recuperar');
    cy.contains('Volver al Login').click();
    cy.url().should('include', '/login');
  });
});
