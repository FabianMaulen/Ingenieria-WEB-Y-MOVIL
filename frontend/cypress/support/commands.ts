/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Inicia sesión directamente contra la API y abre una ruta protegida con la sesión guardada (Taller 11).
       */
      visitarConSesion(ruta: string, correo: string, password: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('visitarConSesion', (ruta: string, correo: string, password: string) => {
  const apiUrl = Cypress.env('API_URL') || 'http://localhost:3000/api';
  cy.request('POST', `${apiUrl}/auth/login`, {
    correo_usuario: correo,
    password,
  }).then((res) => {
    expect(res.status).to.eq(200);
    const { token, usuario } = res.body.data;
    cy.visit(ruta, {
      onBeforeLoad(win) {
        win.localStorage.setItem('auth_token', token);
        win.localStorage.setItem('usuario', JSON.stringify(usuario));
        win.localStorage.setItem('user_rol', usuario.rol);
        win.localStorage.setItem('user_nombre', usuario.nombre);
        win.localStorage.setItem('modo_activo', usuario.rol === 'ADMIN' ? 'ADMIN' : 'TITULAR');
      },
    });
  });
});

export {};
