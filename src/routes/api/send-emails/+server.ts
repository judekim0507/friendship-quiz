import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendMatchEmail } from '$lib/server/resend';
import { PUBLIC_BASE_URL } from '$env/static/public';

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

	// Get matches that haven't had emails sent
	const { data: matches, error: fetchError } = await locals.supabase
		.from('matches')
		.select(`
			*,
			person_a:quiz_submissions!matches_person_a_id_fkey(*),
			person_b:quiz_submissions!matches_person_b_id_fkey(*)
		`)
		.eq('email_sent', false);

	if (fetchError) {
		console.error('Error fetching matches:', fetchError);
		return json({ error: 'Failed to fetch matches' }, { status: 500 });
	}

	if (!matches || matches.length === 0) {
		return json({ error: 'No pending emails to send' }, { status: 400 });
	}

	let sentCount = 0;
	const errors: string[] = [];

	for (const match of matches) {
		const personA = match.person_a;
		const personB = match.person_b;

		if (!personA || !personB) continue;

		try {
			await sendMatchEmail({
				recipientEmail: personA.email,
				compatibilityScore: match.compatibility_score,
				compatibilityTitle: match.compatibility_title,
				resultsUrl: `${PUBLIC_BASE_URL}/${personA.result_slug}`,
				matchName: personB.name,
				matchInstagram: personB.instagram
			});
			sentCount++;
		} catch (e) {
			console.error(`Failed to send email to ${personA.email}:`, e);
			errors.push(`Failed to send to ${personA.email}`);
		}

		try {
			await sendMatchEmail({
				recipientEmail: personB.email,
				compatibilityScore: match.compatibility_score,
				compatibilityTitle: match.compatibility_title,
				resultsUrl: `${PUBLIC_BASE_URL}/${personB.result_slug}`,
				matchName: personA.name,
				matchInstagram: personA.instagram
			});
			sentCount++;
		} catch (e) {
			console.error(`Failed to send email to ${personB.email}:`, e);
			errors.push(`Failed to send to ${personB.email}`);
		}

		// Mark match as email sent
		await locals.supabase
			.from('matches')
			.update({ email_sent: true, email_sent_at: new Date().toISOString() })
			.eq('id', match.id);
	}

	return json({
		sent: sentCount,
		errors: errors.length > 0 ? errors : undefined,
		message: `Sent ${sentCount} emails`
	});
};
