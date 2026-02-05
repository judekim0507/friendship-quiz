export type Step = 'intro' | 'quiz' | 'contact' | 'submitted' | 'already-submitted';

export interface QuizAnswers {
	[questionId: number]: string;
}

export interface DbSubmission {
	id: string;
	created_at: string;
	email: string;
	name: string;
	instagram: string | null;
	answers: QuizAnswers;
	matched: boolean;
	match_id: string | null;
	result_slug: string;
}

export interface DbMatch {
	id: string;
	created_at: string;
	person_a_id: string;
	person_b_id: string;
	compatibility_score: number;
	compatibility_title: string;
	email_sent: boolean;
	email_sent_at: string | null;
}

export interface MatchWithDetails extends DbMatch {
	person_a: DbSubmission;
	person_b: DbSubmission;
}

export type CompatibilityTitle =
	| 'Soulmates'
	| 'Cosmic Twins'
	| 'Kindred Spirits'
	| 'Unlikely Allies'
	| 'Opposites Attract'
	| 'Mystery Match';
