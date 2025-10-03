describe('Notification Center', () => {
  beforeEach(() => {
    cy.visit('/notifications-test')
  })

  it('shows badge and opens dropdown', () => {
    // Wait for the page to render
    cy.get('button[aria-label="Notificações"]').should('exist')

    // Click bell to open dropdown
    cy.get('button[aria-label="Notificações"]').click()

    // The dropdown card should appear in the DOM (portal -> body)
    cy.get('body').within(() => {
      cy.get('.z-50').should('exist')
    })
  })

  it('adds mock notification via UI and updates badge', () => {
    // The test page has a button to add mock notifications
    cy.contains('Add Mock Notification').click()

    // Badge should show at least 1
    cy.get('button[aria-label="Notificações"]').within(() => {
      cy.get('.bg-red-500').should('exist')
    })
  })
})
