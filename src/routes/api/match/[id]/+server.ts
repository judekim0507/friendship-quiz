import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals }) => {
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

	const { id } = params;

	const { data: match, error: fetchError } = await locals.supabase
		.from('matches')
		.select('*')
		.eq('id', id)
		.single();

	if (fetchError || !match) {
		return json({ error: 'Match not found' }, { status: 404 });
	}

	await locals.supabase
		.from('quiz_submissions')
		.update({ matched: false, match_id: null })
		.in('id', [match.person_a_id, match.person_b_id]);

	const { error: deleteError } = await locals.supabase
		.from('matches')
		.delete()
		.eq('id', id);

	if (deleteError) {
		console.error('Error deleting match:', deleteError);
		return json({ error: 'Failed to delete match' }, { status: 500 });
	}

	return json({ message: 'Match deleted successfully' });
};
