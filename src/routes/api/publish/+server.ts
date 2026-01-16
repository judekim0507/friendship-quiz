import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { nanoid } from 'nanoid';

export const POST: RequestHandler = async ({ locals }) => {
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

	const { data: matches, error: fetchError } = await locals.supabase
		.from('matches')
		.select(`
			*,
			person_a:quiz_submissions!matches_person_a_id_fkey(*),
			person_b:quiz_submissions!matches_person_b_id_fkey(*)
		`)
		.eq('published', false);

	if (fetchError) {
		console.error('Error fetching matches:', fetchError);
		return json({ error: 'Failed to fetch matches' }, { status: 500 });
	}

	if (!matches || matches.length === 0) {
		return json({ error: 'No unpublished matches' }, { status: 400 });
	}

	let publishedCount = 0;

	for (const match of matches) {
		const personA = match.person_a;
		const personB = match.person_b;

		if (!personA || !personB) continue;

		const slugA = nanoid(10);
		const slugB = nanoid(10);

		await locals.supabase
			.from('quiz_submissions')
			.update({ result_slug: slugA })
			.eq('id', personA.id);

		await locals.supabase
			.from('quiz_submissions')
			.update({ result_slug: slugB })
			.eq('id', personB.id);

		await locals.supabase
			.from('matches')
			.update({ published: true })
			.eq('id', match.id);

		publishedCount++;
	}

	return json({
		published: publishedCount,
		message: `Published ${publishedCount} matches`
	});
};
