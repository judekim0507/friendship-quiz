import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Get all submissions
	const { data: submissions, error: submissionsError } = await locals.supabase
		.from('quiz_submissions')
		.select('*')
		.order('created_at', { ascending: false });

	if (submissionsError) {
		console.error('Error fetching submissions:', submissionsError);
	}

	// Get all matches with related submissions
	const { data: matches, error: matchesError } = await locals.supabase
		.from('matches')
		.select(`
			*,
			person_a:quiz_submissions!matches_person_a_id_fkey(*),
			person_b:quiz_submissions!matches_person_b_id_fkey(*)
		`)
		.order('created_at', { ascending: false });

	if (matchesError) {
		console.error('Error fetching matches:', matchesError);
	}

	const unmatchedCount = submissions?.filter((s) => !s.matched).length || 0;
	const matchedCount = submissions?.filter((s) => s.matched).length || 0;
	const unpublishedCount = matches?.filter((m) => !m.published).length || 0;
	const pendingEmailCount = matches?.filter((m) => m.published && !m.email_sent).length || 0;

	return {
		submissions: submissions || [],
		matches: matches || [],
		unmatchedCount,
		matchedCount,
		unpublishedCount,
		pendingEmailCount
	};
};
