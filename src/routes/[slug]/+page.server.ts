import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { slug } = params;

	// Find the submission by result_slug
	const { data: submission, error: submissionError } = await locals.supabase
		.from('quiz_submissions')
		.select('*')
		.eq('result_slug', slug)
		.single();

	if (submissionError || !submission) {
		throw error(404, 'Results not found');
	}

	// Check if matched
	if (!submission.matched || !submission.match_id) {
		return {
			status: 'pending',
			message: "Your match hasn't been calculated yet. Check back soon!"
		};
	}

	// Get the match details
	const { data: match, error: matchError } = await locals.supabase
		.from('matches')
		.select(`
			*,
			person_a:quiz_submissions!matches_person_a_id_fkey(*),
			person_b:quiz_submissions!matches_person_b_id_fkey(*)
		`)
		.eq('id', submission.match_id)
		.single();

	if (matchError || !match) {
		throw error(500, 'Failed to load match details');
	}

	// Determine who the match partner is
	const isPersonA = match.person_a_id === submission.id;
	const partner = isPersonA ? match.person_b : match.person_a;

	return {
		status: 'matched',
		compatibilityScore: match.compatibility_score,
		compatibilityTitle: match.compatibility_title,
		partnerInstagram: partner?.instagram || null
	};
};
