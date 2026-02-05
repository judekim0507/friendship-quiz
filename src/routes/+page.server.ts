import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const COOKIE_NAME = 'fq_submitted';

export const load: PageServerLoad = async ({ cookies }) => {
	const hasSubmitted = cookies.get(COOKIE_NAME) === 'true';
	return { hasSubmitted };
};

export const actions = {
	submit: async ({ request, locals, cookies }) => {
		if (cookies.get(COOKIE_NAME) === 'true') {
			return fail(400, { error: 'You have already submitted from this device' });
		}

		const formData = await request.formData();
		const email = formData.get('email') as string;
		const name = formData.get('name') as string;
		const instagram = formData.get('instagram') as string | null;
		const answersJson = formData.get('answers') as string;

		if (!email || !name || !answersJson) {
			return fail(400, { error: 'Email, name, and answers are required' });
		}

		let answers;
		try {
			answers = JSON.parse(answersJson);
		} catch {
			return fail(400, { error: 'Invalid answers format' });
		}

		const { error } = await locals.supabase.from('quiz_submissions').insert({
			email: email.toLowerCase().trim(),
			name: name.trim(),
			instagram: instagram?.replace('@', '').trim() || null,
			answers
		});

		if (error) {
			if (error.code === '23505') {
				return fail(400, { error: 'This email has already submitted a response' });
			}
			console.error('Submission error:', error);
			return fail(500, { error: 'Failed to submit. Please try again.' });
		}

		cookies.set(COOKIE_NAME, 'true', {
			path: '/',
			maxAge: 60 * 60 * 24 * 365, // 1 year
			httpOnly: true,
			secure: true,
			sameSite: 'strict'
		});

		return { success: true };
	}
} satisfies Actions;
