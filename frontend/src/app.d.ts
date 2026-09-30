// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	namespace ImportMetaEnv {
		/** URL completa de la API, incluyendo el sufijo /api. */
		readonly VITE_API_URL?: string;
		/** Origen del backend sin sufijo; el cliente agrega /api automaticamente. */
		readonly PUBLIC_API_ORIGIN?: string;
	}

	interface ImportMeta {
		readonly env?: ImportMetaEnv;
	}
}

export {};
