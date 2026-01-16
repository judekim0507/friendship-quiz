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

	const { data: submission, error: fetchError } = await locals.supabase
		.from('quiz_submissions')
		.select('*')
		.eq('id', id)
		.single();

	if (fetchError || !submission) {
		return json({ error: 'Submission not found' }, { status: 404 });
	}

	if (submission.matched && submission.match_id) {
		const { data: match } = await locals.supabase
			.from('matches')
			.select('*')
			.eq('id', submission.match_id)
			.single();

		if (match) {
			const partnerId = match.person_a_id === id ? match.person_b_id : match.person_a_id;

			await locals.supabase
				.from('quiz_submissions')
				.update({ matched: false, match_id: null })
				.eq('id', partnerId);

			await locals.supabase
				.from('matches')
				.delete()
				.eq('id', submission.match_id);
		}
	}

	const { error: deleteError } = await locals.supabase
		.from('quiz_submissions')
		.delete()
		.eq('id', id);

	if (deleteError) {
		console.error('Error deleting submission:', deleteError);
		return json({ error: 'Failed to delete submission' }, { status: 500 });
	}

	return json({ message: 'Submission deleted successfully' });
};
