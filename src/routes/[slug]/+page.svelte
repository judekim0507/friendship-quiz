<script lang="ts">
	import { fly } from 'svelte/transition';

	let { data } = $props();
</script>

<div class="noise-overlay"></div>

<main class="min-h-dvh flex flex-col justify-center max-w-2xl mx-auto px-6 py-12">
	{#if data.status === 'pending'}
		<section in:fly={{ y: 40, duration: 800 }} class="flex flex-col items-center text-center gap-6">
			<span class="border border-ink px-3 py-1 text-[10px] font-black tracking-widest uppercase">
				Pending
			</span>

			<h1 class="font-serif text-5xl md:text-6xl leading-none">
				Hang tight.
			</h1>

			<p class="text-ink/60 text-lg max-w-sm mt-4">
				{data.message}
			</p>
		</section>
	{:else}
		<section in:fly={{ y: 40, duration: 800 }} class="flex flex-col items-center text-center gap-6">
			<span class="border border-ink px-3 py-1 text-[10px] font-black tracking-widest uppercase">
				{data.compatibilityScore}% Match
			</span>

			<h1 class="font-serif text-7xl md:text-8xl leading-none italic">
				{data.compatibilityTitle}
			</h1>

			<p class="text-ink/60 text-lg max-w-md mt-4">
				{#if data.compatibilityTitle === 'Soulmates'}
					You've found your person. The universe has spoken.
				{:else if data.compatibilityTitle === 'Cosmic Twins'}
					You're cut from the same cosmic cloth.
				{:else if data.compatibilityTitle === 'Kindred Spirits'}
					There's a spark of recognition between you two.
				{:else if data.compatibilityTitle === 'Unlikely Allies'}
					Different paths, but you've got each other's backs.
				{:else if data.compatibilityTitle === 'Opposites Attract'}
					You balance each other out in unexpected ways.
				{:else}
					Every connection holds its own mystery.
				{/if}
			</p>

			<div class="w-full h-px bg-ink/10 my-8"></div>

			<div class="bg-surface px-8 py-8 w-full space-y-4">
				<p class="text-xs font-medium tracking-widest text-ink/40 uppercase">Your Match</p>
				{#if data.partnerName}
					<p class="text-3xl font-serif">{data.partnerName}</p>
				{/if}
				{#if data.partnerInstagram}
					<p class="text-lg text-ink/50">@{data.partnerInstagram}</p>
				{:else if !data.partnerName}
					<p class="text-ink/40 text-sm">
						Check your email for more details.
					</p>
				{/if}
			</div>
		</section>
	{/if}
</main>
