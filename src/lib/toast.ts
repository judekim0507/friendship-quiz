import { browser } from '$app/environment';

type ToastFn = (message: string) => void;

interface ToastModule {
	toast: {
		(message: string): void;
		success: ToastFn;
		error: ToastFn;
	};
}

let modulePromise: Promise<ToastModule> | null = null;

if (browser) {
	modulePromise = import('svelte-sonner') as Promise<ToastModule>;
}

export const toast = {
	success: async (message: string) => {
		if (modulePromise) {
			const mod = await modulePromise;
			mod.toast.success(message);
		}
	},
	error: async (message: string) => {
		if (modulePromise) {
			const mod = await modulePromise;
			mod.toast.error(message);
		}
	}
};
