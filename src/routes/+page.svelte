<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import { questions } from '$lib/questions';
	import type { Step } from '$lib/types';

	let { data } = $props();

	let currentStep = $state<Step>(data.hasSubmitted ? 'already-submitted' : 'intro');
	let questionIndex = $state(0);
	let answers = $state<Record<number, string>>({});
	let isSubmitting = $state(false);
	let isExiting = $state(false);
	let formError = $state<string | null>(null);
	let otherValue = $state('');

	let progress = $derived(((questionIndex + (currentStep === 'quiz' ? 1 : 0)) / questions.length) * 100);
	let currentQuestion = $derived(questions[questionIndex]);

	function handleAnswer(answer: string) {
		answers[currentQuestion.id] = answer;
		isExiting = true;
		otherValue = '';

		setTimeout(() => {
			isExiting = false;
			if (questionIndex < questions.length - 1) {
				questionIndex++;
			} else {
				currentStep = 'contact';
			}
		}, 300);
	}

	function handleOtherSubmit(e: KeyboardEvent) {
		if (e.key === 'Enter' && otherValue.trim()) {
			handleAnswer(otherValue.trim());
		}
	}
</script>

<div class="noise-overlay"></div>

<div class="fixed top-0 left-0 w-full h-1 z-40 bg-transparent">
	<div
		class="h-full bg-accent transition-all duration-500 ease-editorial"
		style="width: {currentStep === 'intro' || currentStep === 'already-submitted' ? 0 : currentStep === 'submitted' ? 100 : progress}%"
	></div>
</div>

<main class="min-h-dvh flex flex-col justify-center max-w-2xl mx-auto px-6 py-12 relative">

	{#if currentStep === 'intro'}
		<section in:fade={{ duration: 400 }} class="flex flex-col gap-8">
			<h1 class="font-serif text-7xl md:text-8xl leading-[0.85] tracking-tight">
				<span class="italic text-accent">A title</span><br />Will go here
			</h1>
			<p class="text-lg md:text-xl text-ink/60 max-w-md">
				And so will the short description. 
			</p>
			<div class="h-24"></div>
			<button
				onclick={() => (currentStep = 'quiz')}
				class="w-full bg-ink text-cream py-6 text-xl font-medium transition-all hover:scale-98 hover:opacity-90 active:scale-95"
			>
				Begin
			</button>
		</section>

	{:else if currentStep === 'quiz'}
		<div class="question-container">
			{#key questionIndex}
				<div class="question-card" class:exiting={isExiting}>
					<h2 class="font-serif text-4xl md:text-6xl leading-tight">
						{currentQuestion.text}
					</h2>

					<div class="flex flex-col gap-2 mt-10">
						{#each currentQuestion.options as option}
							<button
								onclick={() => handleAnswer(option)}
								disabled={isExiting}
								class="w-full text-left p-6 text-lg transition-colors border border-transparent
									   {answers[currentQuestion.id] === option ? 'bg-ink text-cream' : 'bg-surface hover:bg-ink/5'}
									   disabled:pointer-events-none"
							>
								{option}
							</button>
						{/each}

						{#if currentQuestion.allowOther}
							<input
								type="text"
								bind:value={otherValue}
								placeholder="Other..."
								disabled={isExiting}
								onkeydown={handleOtherSubmit}
								class="w-full p-6 text-lg transition-all border border-dashed border-ink/20 bg-transparent
									   placeholder:text-ink/50 text-ink
									   focus:outline-none focus:border-solid focus:border-ink/40 focus:bg-surface
									   disabled:pointer-events-none"
							/>
						{/if}
					</div>
				</div>
			{/key}
		</div>

	{:else if currentStep === 'contact'}
		<form
			method="POST"
			action="?/submit"
			use:enhance={() => {
				isSubmitting = true;
				formError = null;
				return async ({ result }) => {
					isSubmitting = false;
					if (result.type === 'success') {
						currentStep = 'submitted';
					} else if (result.type === 'failure') {
						formError = result.data?.error as string || 'Something went wrong';
					}
				};
			}}
			in:fly={{ y: 20, duration: 500 }}
			class="flex flex-col gap-16"
		>
			<div class="space-y-3">
				<h2 class="font-serif text-4xl md:text-5xl leading-tight">Almost there.</h2>
				<p class="text-ink/50">We'll notify you when your match is ready.</p>
			</div>

			<input type="hidden" name="answers" value={JSON.stringify(answers)} />

			<div class="flex flex-col gap-8">
				<div class="space-y-2">
					<label for="email" class="text-xs font-medium tracking-wide text-ink/40 uppercase">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						placeholder="you@example.com"
						class="w-full bg-transparent border-b border-ink/15 py-3 text-lg focus:outline-none focus:border-ink transition-colors placeholder:text-ink/25"
					/>
				</div>
				<div class="space-y-2">
					<label for="instagram" class="text-xs font-medium tracking-wide text-ink/40 uppercase">
						Instagram <span class="normal-case text-ink/30">(optional)</span>
					</label>
					<div class="flex items-center border-b border-ink/15 focus-within:border-ink transition-colors">
						<span class="text-lg text-ink/30 select-none mr-1">@</span>
						<input
							id="instagram"
							name="instagram"
							type="text"
							placeholder="username"
							class="w-full bg-transparent py-3 text-lg focus:outline-none placeholder:text-ink/25"
						/>
					</div>
				</div>
			</div>

			{#if formError}
				<p class="text-accent text-sm -mt-8">{formError}</p>
			{/if}

			<button
				type="submit"
				disabled={isSubmitting}
				class="w-full bg-ink text-cream py-6 text-xl font-medium transition-all hover:scale-98 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
			>
				{isSubmitting ? 'Submitting...' : 'Finalize Alignment'}
			</button>
		</form>

	{:else if currentStep === 'submitted'}
		<section in:fly={{ y: 40, duration: 800 }} class="flex flex-col items-center text-center gap-6">
			<span class="border border-ink px-3 py-1 text-[10px] font-black tracking-widest uppercase">
				Submitted
			</span>

			<h2 class="font-serif text-6xl md:text-7xl leading-none">
				You're in.
			</h2>

			<p class="text-ink/60 text-lg max-w-sm mt-4">
				We'll calculate your match and send you an email when your results are ready.
			</p>

			<div class="w-full h-px bg-ink/10 my-8"></div>

			<p class="text-ink/40 text-sm">
				Keep an eye on your inbox.
			</p>
		</section>

	{:else if currentStep === 'already-submitted'}
		<section in:fade={{ duration: 400 }} class="flex flex-col items-center text-center gap-6">
			<span class="border border-ink/40 px-3 py-1 text-[10px] font-black tracking-widest uppercase text-ink/40">
				Already Submitted
			</span>

			<h2 class="font-serif text-5xl md:text-6xl leading-none">
				You've already<br />taken this quiz.
			</h2>

			<p class="text-ink/60 text-lg max-w-sm mt-4">
				Only one submission per person allowed. Check your email for your results when they're ready.
			</p>
		</section>
	{/if}

</main>
