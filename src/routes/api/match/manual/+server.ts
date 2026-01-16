import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { calculateCompatibilityScore, getCompatibilityTitle } from '$lib/matching-algorithm';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.getSession();
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { data: adminCheck } = await locals.supabase
		.from('admin_emails')
		.select('email')
		.eq('email', session.user.email?.toLowerCase())
		.single();

	if (!adminCheck) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const { personAId, personBId } = await request.json();

	if (!personAId || !personBId) {
		return json({ error: 'Both personAId and personBId are required' }, { status: 400 });
	}

	const { data: submissions, error: fetchError } = await locals.supabase
		.from('quiz_submissions')
		.select('*')
		.in('id', [personAId, personBId]);

	if (fetchError || !submissions || submissions.length !== 2) {
		return json({ error: 'Could not find both submissions' }, { status: 400 });
	}

	const personA = submissions.find((s) => s.id === personAId);
	const personB = submissions.find((s) => s.id === personBId);

	if (!personA || !personB) {
		return json({ error: 'Could not find both submissions' }, { status: 400 });
	}

	if (personA.matched || personB.matched) {
		return json({ error: 'One or both users are already matched' }, { status: 400 });
	}

	const score = await calculateCompatibilityScore(personA.answers, personB.answers);
	const title = getCompatibilityTitle(score);

	const { data: match, error: insertError } = await locals.supabase
		.from('matches')
		.insert({
			person_a_id: personAId,
			person_b_id: personBId,
			compatibility_score: score,
			compatibility_title: title
		})
		.select(`
			*,
			person_a:quiz_submissions!matches_person_a_id_fkey(*),
			person_b:quiz_submissions!matches_person_b_id_fkey(*)
		`)
		.single();

	if (insertError) {
		console.error('Error creating match:', insertError);
		return json({ error: 'Failed to create match' }, { status: 500 });
	}

	await locals.supabase
		.from('quiz_submissions')
		.update({ matched: true, match_id: match.id })
		.in('id', [personAId, personBId]);

	return json({ match, message: 'Match created successfully' });
};
