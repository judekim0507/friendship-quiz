import { Resend } from 'resend';
import { RESEND_API_KEY, RESEND_FROM_EMAIL } from '$env/static/private';
import { generateMatchEmail } from '$lib/email-templates';

const resend = new Resend(RESEND_API_KEY);

interface SendMatchEmailParams {
	recipientEmail: string;
	compatibilityScore: number;
	compatibilityTitle: string;
	resultsUrl: string;
	matchName?: string | null;
	matchInstagram?: string | null;
}

export async function sendMatchEmail({
	recipientEmail,
	compatibilityScore,
	compatibilityTitle,
	resultsUrl,
	matchName,
	matchInstagram
}: SendMatchEmailParams) {
	const html = generateMatchEmail({
		compatibilityScore,
		compatibilityTitle,
		resultsUrl,
		matchName,
		matchInstagram
	});

	return await resend.emails.send({
		from: RESEND_FROM_EMAIL,
		to: recipientEmail,
		subject: `You're ${compatibilityTitle === 'Soulmates' ? 'Soulmates' : `a ${compatibilityTitle}`}! See your match.`,
		html
	});
}
