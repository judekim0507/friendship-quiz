<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';

	let { form } = $props();

	let isSubmitting = $state(false);
</script>

<div class="noise-overlay"></div>

<main class="min-h-dvh flex flex-col justify-center max-w-md mx-auto px-6 py-12">
	<form
		method="POST"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				isSubmitting = false;
				await update();
			};
		}}
		in:fly={{ y: 20, duration: 400 }}
		class="flex flex-col gap-12"
	>
		<div class="space-y-2">
			<p class="text-xs font-medium tracking-widest text-ink/40 uppercase">Admin</p>
			<h1 class="font-serif text-4xl md:text-5xl">Sign in</h1>
		</div>

		<div class="flex flex-col gap-6">
			<div class="space-y-2">
				<label for="email" class="text-xs font-medium tracking-wide text-ink/40 uppercase">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					autocomplete="email"
					class="w-full bg-transparent border-b border-ink/15 py-3 text-lg focus:outline-none focus:border-ink transition-colors placeholder:text-ink/25"
				/>
			</div>
			<div class="space-y-2">
				<label for="password" class="text-xs font-medium tracking-wide text-ink/40 uppercase">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					autocomplete="current-password"
					class="w-full bg-transparent border-b border-ink/15 py-3 text-lg focus:outline-none focus:border-ink transition-colors"
				/>
			</div>
		</div>

		{#if form?.error}
			<p class="text-accent text-sm -mt-6">{form.error}</p>
		{/if}

		<button
			type="submit"
			disabled={isSubmitting}
			class="w-full bg-ink text-cream py-5 text-lg font-medium transition-all hover:scale-98 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
		>
			{isSubmitting ? 'Signing in...' : 'Sign in'}
		</button>
	</form>
</main>
