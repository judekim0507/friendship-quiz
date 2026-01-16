<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let { children, data } = $props();

	const isLoginPage = $derived(page.url.pathname === '/admin/login');

	let ToasterComponent: any = $state(null);

	onMount(async () => {
		const module = await import('svelte-sonner');
		ToasterComponent = module.Toaster;
	});
</script>

{#if ToasterComponent}
	<ToasterComponent position="bottom-right" toastOptions={{ style: 'font-family: Inter, sans-serif;' }} />
{/if}

<div class="noise-overlay"></div>

{#if !isLoginPage && data.session}
	<header class="fixed top-0 left-0 right-0 z-40 bg-cream/80 backdrop-blur-sm border-b border-ink/5">
		<div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
			<a href="/admin" class="font-serif text-2xl">
				Admin
			</a>

			<div class="flex items-center gap-6">
				<span class="text-sm text-ink/50">{data.userEmail}</span>
				<form method="POST" action="/admin/logout" use:enhance>
					<button
						type="submit"
						class="text-sm font-medium text-ink/60 hover:text-ink transition-colors"
					>
						Sign out
					</button>
				</form>
			</div>
		</div>
	</header>
	<div class="pt-16">
		{@render children()}
	</div>
{:else}
	{@render children()}
{/if}
