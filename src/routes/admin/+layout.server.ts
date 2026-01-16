import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const session = await locals.getSession();

	// Allow access to login page without auth
	if (url.pathname === '/admin/login') {
		return { session };
	}

	// Require auth for all other admin pages
	if (!session) {
		throw redirect(303, '/admin/login');
	}

	// Check if user is an admin
	const { data: adminCheck } = await locals.supabase
		.from('admin_emails')
		.select('email')
		.eq('email', session.user.email?.toLowerCase())
		.single();

	if (!adminCheck) {
		await locals.supabase.auth.signOut();
		throw redirect(303, '/admin/login?error=unauthorized');
	}

	return {
		session,
		userEmail: session.user.email
	};
};
