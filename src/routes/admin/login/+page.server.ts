import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();
	if (session) {
		throw redirect(303, '/admin');
	}
};

export const actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required' });
		}

		const { error } = await locals.supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			return fail(400, { error: 'Invalid email or password' });
		}

		const { data: adminCheck, error: adminError } = await locals.supabase
			.from('admin_emails')
			.select('email')
			.eq('email', email.toLowerCase())
			.single();

		if (adminError || !adminCheck) {
			console.error('Admin check failed:', adminError);
			await locals.supabase.auth.signOut();
			return fail(403, { error: 'You are not authorized to access the admin panel' });
		}

		throw redirect(303, '/admin');
	}
} satisfies Actions;
