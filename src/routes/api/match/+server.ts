import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createMatches } from '$lib/matching-algorithm';

export const POST: RequestHandler = async ({ locals }) => {
	// Check auth
	const session = await locals.getSession();
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check admin
	const { data: adminCheck } = await locals.supabase
		.from('admin_emails')
		.select('email')
		.eq('email', session.user.email?.toLowerCase())
		.single();

	if (!adminCheck) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	// Get unmatched submissions
	const { data: submissions, error: fetchError } = await locals.supabase
		.from('quiz_submissions')
		.select('*')
		.eq('matched', false);

	if (fetchError) {
		console.error('Error fetching submissions:', fetchError);
		return json({ error: 'Failed to fetch submissions' }, { status: 500 });
	}

	if (!submissions || submissions.length < 2) {
		return json({ error: 'Not enough unmatched submissions (need at least 2)' }, { status: 400 });
	}

	const { matches, unmatchedId } = await createMatches(submissions);

	if (matches.length === 0) {
		return json({ error: 'No matches could be created' }, { status: 400 });
	}

	const matchInserts = matches.map((m: { personAId: string; personBId: string; score: number; title: string }) => ({
		person_a_id: m.personAId,
		person_b_id: m.personBId,
		compatibility_score: m.score,
		compatibility_title: m.title
	}));

	const { data: insertedMatches, error: insertError } = await locals.supabase
		.from('matches')
		.insert(matchInserts)
		.select(`
			*,
			person_a:quiz_submissions!matches_person_a_id_fkey(*),
			person_b:quiz_submissions!matches_person_b_id_fkey(*)
		`);

	if (insertError) {
		console.error('Error inserting matches:', insertError);
		return json({ error: 'Failed to save matches' }, { status: 500 });
	}

	const matchedIds = matches.flatMap((m: { personAId: string; personBId: string }) => [m.personAId, m.personBId]);

	for (const match of insertedMatches || []) {
		await locals.supabase
			.from('quiz_submissions')
			.update({ matched: true, match_id: match.id })
			.in('id', [match.person_a_id, match.person_b_id]);
	}

	return json({
		matches: insertedMatches,
		unmatchedId,
		message: `Created ${matches.length} matches`
	});
};
