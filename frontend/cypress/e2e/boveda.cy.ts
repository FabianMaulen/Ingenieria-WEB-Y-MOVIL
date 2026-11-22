describe('Baúl Eterno — Flujo principal autenticado (E2E)', () => {
  const correo = Cypress.env('TEST_USER_EMAIL') || 'admin@bauleterno.cl';
  const password = Cypress.env('TEST_USER_PASSWORD') || 'Admin1234!';

  it('permite entrar a Pólizas y muestra la cobertura total en CLP y UF', () => {
    cy.visitarConSesion('/polizas', correo, password);
    cy.url().should('include', '/polizas');
    cy.contains('Pólizas Registradas').should('be.visible');
    cy.contains('Cobertura Total Protegida').should('be.visible');
  });

  it('permite redactar mensajes a albaceas o a personas externas por correo', () => {
    cy.visitarConSesion('/mensajes', correo, password);
    cy.url().should('include', '/mensajes');
    cy.contains('Persona externa (por correo)').click();
    cy.get('input[placeholder*="destinatario@correo.cl"]').should('be.visible');
  });

  it('muestra la confirmación antes de cerrar sesión desde Configuración', () => {
    cy.visitarConSesion('/configuracion', correo, password);
    cy.url().should('include', '/configuracion');
    cy.contains('button', 'Cerrar sesión activa').click();
    cy.contains('¿Cerrar sesión?').should('be.visible');
    cy.contains('button', 'Cancelar').click();
    cy.url().should('include', '/configuracion');
  });
});
