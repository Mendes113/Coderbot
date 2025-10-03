// Minimal JS commands file to avoid TypeScript resolution issues for Cypress bundling
// Keep this file intentionally minimal and avoid adding commands that collide with
// Cypress built-in or third-party command names. Export helper functions instead
// of adding to Cypress.Commands here.

// Example helper (do not register as a Cypress command):
export const helpers = {
	noop: () => {
		// intentionally empty
	},
};

// If you need to add custom Cypress commands, prefer unique names or use
// Cypress.Commands.overwrite when intentionally replacing an existing command.
