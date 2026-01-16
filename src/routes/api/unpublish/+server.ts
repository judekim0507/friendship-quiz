import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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
		.select('id, person_a_id, person_b_id')
		.eq('published', true)
		.eq('email_sent', false);

	if (fetchError) {
		return json({ error: 'Failed to fetch matches' }, { status: 500 });
	}

	if (!matches || matches.length === 0) {
		return json({ error: 'No published matches to unpublish' }, { status: 400 });
	}

	let unpublishedCount = 0;

	for (const match of matches) {
		await locals.supabase
			.from('quiz_submissions')
			.update({ result_slug: null })
			.in('id', [match.person_a_id, match.person_b_id]);

		await locals.supabase
			.from('matches')
			.update({ published: false })
			.eq('id', match.id);

		unpublishedCount++;
	}

	return json({
		unpublished: unpublishedCount,
		message: `Unpublished ${unpublishedCount} matches`
	});
};
