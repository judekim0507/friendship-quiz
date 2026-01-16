import { questions, getOptionSimilarity } from './questions';
import type { QuizAnswers, CompatibilityTitle, DbSubmission } from './types';
import { batchCompareAllPairs } from './server/gemini';

function isOtherAnswer(answer: string, questionId: number): boolean {
	const question = questions.find((q) => q.id === questionId);
	if (!question) return false;
	return !(question.options as readonly string[]).includes(answer);
}

function getAnswerSimilarity(questionId: number, answerA: string, answerB: string): number {
	if (answerA === answerB) return 1;
	const aIsOther = isOtherAnswer(answerA, questionId);
	const bIsOther = isOtherAnswer(answerB, questionId);
	if (aIsOther || bIsOther) return -1; // needs Gemini
	return getOptionSimilarity(questionId, answerA, answerB);
}

export function getCompatibilityTitle(score: number): CompatibilityTitle {
	if (score >= 90) return 'Soulmates';
	if (score >= 75) return 'Cosmic Twins';
	if (score >= 60) return 'Kindred Spirits';
	if (score >= 45) return 'Unlikely Allies';
	if (score >= 30) return 'Opposites Attract';
	return 'Mystery Match';
}

interface MatchResult {
	personAId: string;
	personBId: string;
	score: number;
	title: CompatibilityTitle;
}

interface PairData {
	a: string;
	b: string;
	localScore: number; // score from local similarity (exact + partial matches)
	freeTextComparisons: Array<{
		id: string;
		questionId: number;
		questionText: string;
		answerA: string;
		answerB: string;
		weight: number;
	}>;
}

export async function createMatches(submissions: DbSubmission[]): Promise<{
	matches: MatchResult[];
	unmatchedId: string | null;
}> {
	if (submissions.length < 2) {
		return { matches: [], unmatchedId: submissions[0]?.id || null };
	}

	const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);
	const pairsData: PairData[] = [];
	const allFreeTextComparisons: Array<{
		id: string;
		questionId: number;
		questionText: string;
		answerA: string;
		answerB: string;
	}> = [];

	for (let i = 0; i < submissions.length; i++) {
		for (let j = i + 1; j < submissions.length; j++) {
			const answersA = submissions[i].answers;
			const answersB = submissions[j].answers;
			const pairId = `${submissions[i].id}-${submissions[j].id}`;

			let localScore = 0;
			const freeTextComparisons: PairData['freeTextComparisons'] = [];

			for (const q of questions) {
				const aAnswer = answersA[q.id];
				const bAnswer = answersB[q.id];

				if (!aAnswer || !bAnswer) continue;

				const similarity = getAnswerSimilarity(q.id, aAnswer, bAnswer);

				if (similarity === -1) {
					// needs Gemini for free-text comparison
					const compId = `${pairId}-q${q.id}`;
					freeTextComparisons.push({
						id: compId,
						questionId: q.id,
						questionText: q.text,
						answerA: aAnswer,
						answerB: bAnswer,
						weight: q.weight
					});
					allFreeTextComparisons.push({
						id: compId,
						questionId: q.id,
						questionText: q.text,
						answerA: aAnswer,
						answerB: bAnswer
					});
				} else {
					// use local similarity (1.0 for exact, 0.x for partial, 0 for none)
					localScore += similarity * q.weight;
				}
			}

			pairsData.push({
				a: submissions[i].id,
				b: submissions[j].id,
				localScore,
				freeTextComparisons
			});
		}
	}

	const geminiScores = await batchCompareAllPairs(allFreeTextComparisons);

	const pairs: { a: string; b: string; score: number }[] = pairsData.map((pd) => {
		let weightedScore = pd.localScore;

		for (const c of pd.freeTextComparisons) {
			const geminiScore = geminiScores.get(c.id) ?? 50;
			weightedScore += (geminiScore / 100) * c.weight;
		}

		return {
			a: pd.a,
			b: pd.b,
			score: Math.round((weightedScore / totalWeight) * 100)
		};
	});

	pairs.sort((x, y) => y.score - x.score);

	const matches: MatchResult[] = [];
	const matched = new Set<string>();

	for (const pair of pairs) {
		if (!matched.has(pair.a) && !matched.has(pair.b)) {
			matches.push({
				personAId: pair.a,
				personBId: pair.b,
				score: pair.score,
				title: getCompatibilityTitle(pair.score)
			});
			matched.add(pair.a);
			matched.add(pair.b);
		}
	}

	const unmatchedId = submissions.find((s) => !matched.has(s.id))?.id || null;

	return { matches, unmatchedId };
}

export async function calculateCompatibilityScore(
	answersA: QuizAnswers,
	answersB: QuizAnswers
): Promise<number> {
	const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);
	let localScore = 0;
	const freeTextComparisons: Array<{
		id: string;
		questionId: number;
		questionText: string;
		answerA: string;
		answerB: string;
		weight: number;
	}> = [];

	for (const q of questions) {
		const aAnswer = answersA[q.id];
		const bAnswer = answersB[q.id];

		if (!aAnswer || !bAnswer) continue;

		const similarity = getAnswerSimilarity(q.id, aAnswer, bAnswer);

		if (similarity === -1) {
			freeTextComparisons.push({
				id: `manual-q${q.id}`,
				questionId: q.id,
				questionText: q.text,
				answerA: aAnswer,
				answerB: bAnswer,
				weight: q.weight
			});
		} else {
			localScore += similarity * q.weight;
		}
	}

	let weightedScore = localScore;

	if (freeTextComparisons.length > 0) {
		const geminiScores = await batchCompareAllPairs(freeTextComparisons);
		for (const c of freeTextComparisons) {
			const score = geminiScores.get(c.id) ?? 50;
			weightedScore += (score / 100) * c.weight;
		}
	}

	return Math.round((weightedScore / totalWeight) * 100);
}
