<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { fly, fade } from 'svelte/transition';
	import { questions } from '$lib/questions';
	import { toast } from '$lib/toast';

	let { data } = $props();

	let isMatching = $state(false);
	let isPublishing = $state(false);
	let isUnpublishing = $state(false);
	let isSendingEmails = $state(false);

	let selectedSubmission = $state<any | null>(null);
	let selectedMatch = $state<any | null>(null);
	let selectedForMatch = $state<string[]>([]);
	let isCreatingMatch = $state(false);
	let activeTab = $state<'submissions' | 'matches' | 'analytics'>('submissions');

// Analytics computed data
const analyticsData = $derived(() => {
	const submissions = data.submissions;
	const total = submissions.length;

	if (total === 0) return { questions: [], total: 0 };

	const questionStats = questions.map((q) => {
		const answerCounts: Record<string, number> = {};
		const otherAnswers: string[] = [];

		// Initialize counts for predefined options
		q.options.forEach((opt) => {
			answerCounts[opt] = 0;
		});

		// Count answers
		submissions.forEach((sub: any) => {
			const answer = sub.answers?.[q.id];
			if (!answer) return;

			if (q.options.includes(answer)) {
				answerCounts[answer]++;
			} else {
				// It's an "Other" answer
				otherAnswers.push(answer);
				answerCounts['Other'] = (answerCounts['Other'] || 0) + 1;
			}
		});

		// Convert to sorted array with percentages
		const distribution = Object.entries(answerCounts)
			.map(([option, count]) => ({
				option,
				count,
				percentage: total > 0 ? Math.round((count / total) * 100) : 0
			}))
			.sort((a, b) => b.count - a.count);

		return {
			id: q.id,
			text: q.text,
			distribution,
			otherAnswers: [...new Set(otherAnswers)], // unique other answers
			totalResponses: submissions.filter((s: any) => s.answers?.[q.id]).length
		};
	});

	return { questions: questionStats, total };
});

	async function runMatching() {
		isMatching = true;

		try {
			const res = await fetch('/api/match', { method: 'POST' });
			const result = await res.json();

			if (!res.ok) throw new Error(result.error || 'Failed to run matching');

			toast.success(`Created ${result.matches.length} matches`);
			await invalidateAll();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Something went wrong');
		} finally {
			isMatching = false;
		}
	}

	async function publishMatches() {
		isPublishing = true;

		try {
			const res = await fetch('/api/publish', { method: 'POST' });
			const result = await res.json();

			if (!res.ok) throw new Error(result.error || 'Failed to publish');

			toast.success(`Published ${result.published} matches`);
			await invalidateAll();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Something went wrong');
		} finally {
			isPublishing = false;
		}
	}

	async function unpublishMatches() {
		if (!confirm('Unpublish all published matches? This will delete their result URLs.')) return;

		isUnpublishing = true;

		try {
			const res = await fetch('/api/unpublish', { method: 'POST' });
			const result = await res.json();

			if (!res.ok) throw new Error(result.error || 'Failed to unpublish');

			toast.success(`Unpublished ${result.unpublished} matches`);
			await invalidateAll();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Something went wrong');
		} finally {
			isUnpublishing = false;
		}
	}

	async function sendEmails() {
		isSendingEmails = true;

		try {
			const res = await fetch('/api/send-emails', { method: 'POST' });
			const result = await res.json();

			if (!res.ok) throw new Error(result.error || 'Failed to send emails');

			toast.success(`Sent ${result.sent} emails`);
			await invalidateAll();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Something went wrong');
		} finally {
			isSendingEmails = false;
		}
	}

	async function createManualMatch() {
		if (selectedForMatch.length !== 2) return;

		isCreatingMatch = true;

		try {
			const res = await fetch('/api/match/manual', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					personAId: selectedForMatch[0],
					personBId: selectedForMatch[1]
				})
			});
			const result = await res.json();

			if (!res.ok) throw new Error(result.error || 'Failed to create match');

			toast.success('Match created');
			selectedForMatch = [];
			await invalidateAll();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Something went wrong');
		} finally {
			isCreatingMatch = false;
		}
	}

	async function deleteMatch(matchId: string) {
		if (!confirm('Delete this match? Both users will become unmatched.')) return;

		try {
			const res = await fetch(`/api/match/${matchId}`, { method: 'DELETE' });
			if (!res.ok) throw new Error('Failed to delete');

			toast.success('Match deleted');
			await invalidateAll();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Something went wrong');
		}
	}

	async function deleteSubmission(id: string) {
		if (!confirm('Delete this submission permanently?')) return;

		try {
			const res = await fetch(`/api/submission/${id}`, { method: 'DELETE' });
			if (!res.ok) throw new Error('Failed to delete');

			selectedSubmission = null;
			toast.success('Submission deleted');
			await invalidateAll();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Something went wrong');
		}
	}

	function toggleSelect(id: string) {
		if (selectedForMatch.includes(id)) {
			selectedForMatch = selectedForMatch.filter((s) => s !== id);
		} else if (selectedForMatch.length < 2) {
			selectedForMatch = [...selectedForMatch, id];
		}
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function getQuestionText(id: number) {
		return questions.find((q) => q.id === id)?.text || `Question ${id}`;
	}

	const unmatchedSubmissions = $derived(data.submissions.filter((s: any) => !s.matched));
</script>

<main class="max-w-7xl mx-auto px-6 py-8">
	<div class="grid grid-cols-5 gap-3 mb-8">
		<div class="bg-surface p-5 border border-ink/5">
			<p class="text-[10px] font-medium tracking-widest text-ink/40 uppercase">Total</p>
			<p class="font-serif text-3xl mt-1">{data.submissions.length}</p>
		</div>
		<div class="bg-surface p-5 border border-ink/5">
			<p class="text-[10px] font-medium tracking-widest text-ink/40 uppercase">Unmatched</p>
			<p class="font-serif text-3xl mt-1">{data.unmatchedCount}</p>
		</div>
		<div class="bg-surface p-5 border border-ink/5">
			<p class="text-[10px] font-medium tracking-widest text-ink/40 uppercase">Matched</p>
			<p class="font-serif text-3xl mt-1">{data.matchedCount}</p>
		</div>
		<div class="bg-surface p-5 border border-ink/5">
			<p class="text-[10px] font-medium tracking-widest text-ink/40 uppercase">Unpublished</p>
			<p class="font-serif text-3xl mt-1">{data.unpublishedCount}</p>
		</div>
		<div class="bg-surface p-5 border border-ink/5">
			<p class="text-[10px] font-medium tracking-widest text-ink/40 uppercase">Emails Pending</p>
			<p class="font-serif text-3xl mt-1">{data.pendingEmailCount}</p>
		</div>
	</div>

	<div class="flex items-center justify-between mb-6">
		<div class="flex gap-1 bg-surface p-1 border border-ink/5">
			<button
				onclick={() => (activeTab = 'submissions')}
				class="px-4 py-2 text-sm font-medium transition-colors {activeTab === 'submissions'
					? 'bg-ink text-cream'
					: 'text-ink/60 hover:text-ink'}"
			>
				Submissions
			</button>
			<button
				onclick={() => (activeTab = 'matches')}
				class="px-4 py-2 text-sm font-medium transition-colors {activeTab === 'matches'
					? 'bg-ink text-cream'
					: 'text-ink/60 hover:text-ink'}"
			>
				Matches
			</button>
			<button
				onclick={() => (activeTab = 'analytics')}
				class="px-4 py-2 text-sm font-medium transition-colors {activeTab === 'analytics'
					? 'bg-ink text-cream'
					: 'text-ink/60 hover:text-ink'}"
			>
				Analytics
			</button>
		</div>

		<div class="flex gap-3">
			{#if selectedForMatch.length === 2}
				<button
					onclick={createManualMatch}
					disabled={isCreatingMatch}
					class="bg-accent text-cream px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
				>
					{isCreatingMatch ? 'Creating...' : 'Match Selected'}
				</button>
			{/if}

			{#if selectedForMatch.length > 0}
				<button
					onclick={() => (selectedForMatch = [])}
					class="border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink/60 hover:text-ink hover:border-ink/40 transition-colors"
				>
					Clear ({selectedForMatch.length})
				</button>
			{/if}

			<button
				onclick={runMatching}
				disabled={isMatching || data.unmatchedCount < 2}
				class="bg-ink text-cream px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
			>
				{isMatching ? 'Matching...' : 'Auto Match'}
			</button>

			{#if data.unpublishedCount > 0}
				<button
					onclick={publishMatches}
					disabled={isPublishing}
					class="bg-emerald-600 text-white px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
				>
					{isPublishing ? 'Publishing...' : `Publish (${data.unpublishedCount})`}
				</button>
			{/if}

			{#if data.pendingEmailCount > 0}
				<button
					onclick={unpublishMatches}
					disabled={isUnpublishing}
					class="border border-amber-500 text-amber-600 px-5 py-2.5 text-sm font-medium transition-all hover:bg-amber-50 active:scale-95 disabled:opacity-50"
				>
					{isUnpublishing ? 'Unpublishing...' : `Unpublish (${data.pendingEmailCount})`}
				</button>
			{/if}

			{#if data.pendingEmailCount > 0}
				<button
					onclick={sendEmails}
					disabled={isSendingEmails}
					class="border border-ink px-5 py-2.5 text-sm font-medium transition-all hover:bg-ink hover:text-cream active:scale-95 disabled:opacity-50"
				>
					{isSendingEmails ? 'Sending...' : `Send Emails (${data.pendingEmailCount})`}
				</button>
			{/if}
		</div>
	</div>

	{#if activeTab === 'submissions'}
		<div class="bg-white border border-ink/5">
			{#if data.submissions.length === 0}
				<div class="p-12 text-center text-ink/40">No submissions yet</div>
			{:else}
				<div class="divide-y divide-ink/5">
					{#each data.submissions as submission (submission.id)}
						{@const isSelected = selectedForMatch.includes(submission.id)}
						<div
							class="flex items-center gap-4 px-5 py-4 hover:bg-ink/[0.02] transition-colors cursor-pointer group"
							onclick={() => (selectedSubmission = submission)}
						>
							{#if !submission.matched}
								<button
									onclick={(e) => {
										e.stopPropagation();
										toggleSelect(submission.id);
									}}
									class="-m-2 p-2 flex items-center justify-center"
								>
									<div class="w-5 h-5 border-2 rounded-sm flex items-center justify-center transition-colors
										   {isSelected ? 'bg-ink border-ink' : 'border-ink/20 group-hover:border-ink/40'}">
										{#if isSelected}
											<svg class="w-3 h-3 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
											</svg>
										{/if}
									</div>
								</button>
							{:else}
								<div class="w-5"></div>
							{/if}

							<div class="flex-1 min-w-0">
								<p class="font-medium truncate">{submission.name || submission.email}</p>
								<p class="text-sm text-ink/50">
									{submission.name ? submission.email : ''}
									{submission.name && submission.instagram ? ' · ' : ''}
									{submission.instagram ? `@${submission.instagram}` : submission.name ? '' : 'No Instagram'}
									<span class="mx-2">·</span>
									{formatDate(submission.created_at)}
								</p>
							</div>

							<div class="flex items-center gap-3">
								{#if submission.matched}
									<span class="text-xs font-medium px-2.5 py-1 bg-ink/5 text-ink/60">Matched</span>
								{:else}
									<span class="text-xs font-medium px-2.5 py-1 bg-amber-50 text-amber-600">Pending</span>
								{/if}
								<svg class="w-4 h-4 text-ink/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else if activeTab === 'matches'}
		<div class="bg-white border border-ink/5">
			{#if data.matches.length === 0}
				<div class="p-12 text-center text-ink/40">No matches yet</div>
			{:else}
				<div class="divide-y divide-ink/5">
					{#each data.matches as match (match.id)}
						<div
							class="px-5 py-4 hover:bg-ink/[0.02] transition-colors cursor-pointer"
							onclick={() => (selectedMatch = match)}
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-6">
									<div class="flex items-center gap-3">
										<div class="text-left">
											<p class="font-medium">{match.person_a?.name || match.person_a?.email}</p>
											<p class="text-xs text-ink/50">{match.person_a?.name ? match.person_a.email : ''}{match.person_a?.instagram ? ` · @${match.person_a.instagram}` : ''}</p>
										</div>

										<div class="flex items-center gap-2 px-3">
											<div class="w-8 h-px bg-ink/20"></div>
											<div class="text-center">
												<p class="font-serif text-lg">{match.compatibility_score}%</p>
												<p class="text-[10px] text-ink/50 uppercase tracking-wide">{match.compatibility_title}</p>
											</div>
											<div class="w-8 h-px bg-ink/20"></div>
										</div>

										<div class="text-left">
											<p class="font-medium">{match.person_b?.name || match.person_b?.email}</p>
											<p class="text-xs text-ink/50">{match.person_b?.name ? match.person_b.email : ''}{match.person_b?.instagram ? ` · @${match.person_b.instagram}` : ''}</p>
										</div>
									</div>
								</div>

								<div class="flex items-center gap-3">
									{#if match.email_sent}
										<span class="text-xs font-medium px-2.5 py-1 bg-emerald-50 text-emerald-600">Sent</span>
									{:else if match.published}
										<span class="text-xs font-medium px-2.5 py-1 bg-blue-50 text-blue-600">Published</span>
									{:else}
										<span class="text-xs font-medium px-2.5 py-1 bg-ink/5 text-ink/50">Draft</span>
									{/if}

									<button
										onclick={(e) => { e.stopPropagation(); deleteMatch(match.id); }}
										class="p-2 text-ink/30 hover:text-accent transition-colors"
									>
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</button>

									<svg class="w-4 h-4 text-ink/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
									</svg>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else if activeTab === 'analytics'}
		{@const stats = analyticsData()}
		<div class="space-y-6">
			{#if stats.total === 0}
				<div class="bg-white border border-ink/5 p-12 text-center text-ink/40">
					No submissions yet to analyze
				</div>
			{:else}
				<!-- Summary header -->
				<div class="bg-surface border border-ink/5 p-5">
					<div class="flex items-center gap-3">
						<svg class="w-5 h-5 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
						</svg>
						<div>
							<p class="text-[10px] font-medium tracking-widest text-ink/40 uppercase">Response Analytics</p>
							<p class="text-sm text-ink/60 mt-0.5">
								Based on <span class="font-serif text-ink">{stats.total}</span> submission{stats.total !== 1 ? 's' : ''}
							</p>
						</div>
					</div>
				</div>

				<!-- Questions -->
				{#each stats.questions as q, index (q.id)}
					<div class="bg-white border border-ink/5 overflow-hidden">
						<!-- Question header -->
						<div class="px-6 py-4 border-b border-ink/5 bg-ink/[0.01]">
							<div class="flex items-start justify-between gap-4">
								<div class="flex items-start gap-3">
									<span class="flex-shrink-0 w-7 h-7 bg-ink text-cream font-serif text-sm flex items-center justify-center mt-0.5">
										{index + 1}
									</span>
									<div>
										<h3 class="font-serif text-lg">{q.text}</h3>
										<p class="text-xs text-ink/40 mt-1">
											{q.totalResponses} response{q.totalResponses !== 1 ? 's' : ''}
										</p>
									</div>
								</div>
							</div>
						</div>

						<!-- Answer distribution -->
						<div class="p-6">
							<div class="space-y-3">
								{#each q.distribution as item (item.option)}
									{@const isTopAnswer = item.count > 0 && item.count === q.distribution[0].count}
									<div class="group">
										<div class="flex items-center justify-between mb-1.5">
											<span class="text-sm font-medium {item.option === 'Other' ? 'text-ink/50 italic' : ''}">
												{item.option}
											</span>
											<span class="text-sm tabular-nums {isTopAnswer && item.count > 0 ? 'font-semibold text-ink' : 'text-ink/50'}">
												{item.count}
												<span class="text-ink/30 ml-1">({item.percentage}%)</span>
											</span>
										</div>
										<div class="h-8 bg-surface overflow-hidden relative">
											<div
												class="h-full transition-all duration-500 ease-out {isTopAnswer && item.count > 0 ? 'bg-ink' : 'bg-ink/20'}"
												style="width: {item.percentage}%"
											></div>
											{#if item.percentage > 0}
												<div class="absolute inset-y-0 left-3 flex items-center">
													<span class="text-xs font-medium {isTopAnswer && item.percentage > 15 ? 'text-cream' : item.percentage > 15 ? 'text-ink/60' : 'text-ink/40'}">
														{item.percentage}%
													</span>
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>

							<!-- Other answers detail -->
							{#if q.otherAnswers.length > 0}
								<div class="mt-6 pt-4 border-t border-ink/5">
									<p class="text-[10px] font-medium tracking-widest text-ink/40 uppercase mb-3">
										"Other" responses
									</p>
									<div class="flex flex-wrap gap-2">
										{#each q.otherAnswers as otherAnswer}
											<span class="inline-block px-3 py-1.5 bg-surface text-sm text-ink/70 border border-ink/5">
												{otherAnswer}
											</span>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			{/if}
		</div>
	{/if}
</main>

{#if selectedSubmission}
	<div
		class="fixed inset-0 bg-ink/40 z-50 flex items-center justify-end"
		transition:fade={{ duration: 150 }}
		onclick={() => (selectedSubmission = null)}
	>
		<div
			class="bg-cream h-full w-full max-w-lg overflow-y-auto"
			transition:fly={{ x: 400, duration: 250 }}
			onclick={(e) => e.stopPropagation()}
		>
			<div class="sticky top-0 bg-cream border-b border-ink/10 px-6 py-4 flex items-center justify-between">
				<h2 class="font-serif text-xl">Submission</h2>
				<button onclick={() => (selectedSubmission = null)} class="p-2 text-ink/50 hover:text-ink">
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="p-6 space-y-6">
				<div>
					<p class="text-[10px] font-medium tracking-widest text-ink/40 uppercase mb-1">Name</p>
					<p class="text-lg">{selectedSubmission.name || '-'}</p>
				</div>

				<div>
					<p class="text-[10px] font-medium tracking-widest text-ink/40 uppercase mb-1">Email</p>
					<p class="text-lg">{selectedSubmission.email}</p>
				</div>

				<div>
					<p class="text-[10px] font-medium tracking-widest text-ink/40 uppercase mb-1">Instagram</p>
					<p class="text-lg">{selectedSubmission.instagram ? `@${selectedSubmission.instagram}` : '-'}</p>
				</div>

				<div>
					<p class="text-[10px] font-medium tracking-widest text-ink/40 uppercase mb-1">Submitted</p>
					<p class="text-lg">{formatDate(selectedSubmission.created_at)}</p>
				</div>

				<div>
					<p class="text-[10px] font-medium tracking-widest text-ink/40 uppercase mb-1">Status</p>
					<p class="text-lg">{selectedSubmission.matched ? 'Matched' : 'Pending'}</p>
				</div>

				<div>
					<p class="text-[10px] font-medium tracking-widest text-ink/40 uppercase mb-1">Result Link</p>
					<p class="text-sm font-mono text-ink/60 break-all">/{selectedSubmission.result_slug}</p>
				</div>

				<div class="border-t border-ink/10 pt-6">
					<p class="text-[10px] font-medium tracking-widest text-ink/40 uppercase mb-4">Answers</p>
					<div class="space-y-4">
						{#each Object.entries(selectedSubmission.answers) as [qId, answer]}
							<div>
								<p class="text-sm text-ink/50">{getQuestionText(Number(qId))}</p>
								<p class="font-medium">{answer}</p>
							</div>
						{/each}
					</div>
				</div>

				<div class="border-t border-ink/10 pt-6">
					<button
						onclick={() => deleteSubmission(selectedSubmission.id)}
						class="text-sm text-accent hover:underline"
					>
						Delete submission
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if selectedMatch}
	<div
		class="fixed inset-0 bg-ink/40 z-50 flex items-center justify-end"
		transition:fade={{ duration: 150 }}
		onclick={() => (selectedMatch = null)}
	>
		<div
			class="bg-cream h-full w-full max-w-2xl overflow-y-auto"
			transition:fly={{ x: 500, duration: 250 }}
			onclick={(e) => e.stopPropagation()}
		>
			<div class="sticky top-0 bg-cream border-b border-ink/10 px-6 py-4 flex items-center justify-between z-10">
				<div>
					<h2 class="font-serif text-xl">Match Comparison</h2>
					<p class="text-sm text-ink/50">{selectedMatch.compatibility_score}% · {selectedMatch.compatibility_title}</p>
				</div>
				<button onclick={() => (selectedMatch = null)} class="p-2 text-ink/50 hover:text-ink">
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="p-6">
				<div class="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-ink/10">
					<div>
						<p class="text-[10px] font-medium tracking-widest text-ink/40 uppercase mb-1">Person A</p>
						<p class="font-medium">{selectedMatch.person_a?.name || selectedMatch.person_a?.email}</p>
						<p class="text-sm text-ink/50">{selectedMatch.person_a?.name ? selectedMatch.person_a.email : ''}</p>
						<p class="text-sm text-ink/50">{selectedMatch.person_a?.instagram ? `@${selectedMatch.person_a.instagram}` : ''}</p>
					</div>
					<div>
						<p class="text-[10px] font-medium tracking-widest text-ink/40 uppercase mb-1">Person B</p>
						<p class="font-medium">{selectedMatch.person_b?.name || selectedMatch.person_b?.email}</p>
						<p class="text-sm text-ink/50">{selectedMatch.person_b?.name ? selectedMatch.person_b.email : ''}</p>
						<p class="text-sm text-ink/50">{selectedMatch.person_b?.instagram ? `@${selectedMatch.person_b.instagram}` : ''}</p>
					</div>
				</div>

				<p class="text-[10px] font-medium tracking-widest text-ink/40 uppercase mb-4">Answer Comparison</p>
				<div class="space-y-4">
					{#each questions as q}
						{@const answerA = selectedMatch.person_a?.answers?.[q.id]}
						{@const answerB = selectedMatch.person_b?.answers?.[q.id]}
						{@const isMatch = answerA === answerB}
						<div class="border border-ink/10 overflow-hidden">
							<div class="bg-ink/[0.02] px-4 py-2 border-b border-ink/10">
								<p class="text-sm font-medium">{q.text}</p>
							</div>
							<div class="grid grid-cols-2 divide-x divide-ink/10">
								<div class="px-4 py-3 {isMatch ? 'bg-emerald-50/50' : ''}">
									<p class="text-sm {isMatch ? 'text-emerald-700' : ''}">{answerA || '-'}</p>
								</div>
								<div class="px-4 py-3 {isMatch ? 'bg-emerald-50/50' : ''}">
									<p class="text-sm {isMatch ? 'text-emerald-700' : ''}">{answerB || '-'}</p>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<div class="border-t border-ink/10 pt-6 mt-6">
					<button
						onclick={() => { deleteMatch(selectedMatch.id); selectedMatch = null; }}
						class="text-sm text-accent hover:underline"
					>
						Delete match
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
