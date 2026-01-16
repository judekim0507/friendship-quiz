import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '$env/static/private';

if (!GEMINI_API_KEY) {
	throw new Error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

interface Comparison {
	id: string;
	questionId: number;
	questionText: string;
	answerA: string;
	answerB: string;
}

export async function batchCompareAllPairs(
	allComparisons: Comparison[]
): Promise<Map<string, number>> {
	if (allComparisons.length === 0) {
		return new Map();
	}

	console.log(`[Gemini] Comparing ${allComparisons.length} answer pairs in single request`);

	const comparisonsText = allComparisons
		.map((c, i) => `${i + 1}. Question: "${c.questionText}" | A: "${c.answerA}" | B: "${c.answerB}"`)
		.join('\n');

	const prompt = `Rate compatibility for each pair (0-100). Consider semantic similarity.

${comparisonsText}

Respond with ONLY numbers separated by commas, one per pair. Example for 3 pairs: 75,50,25`;

	const result = await model.generateContent(prompt);
	const response = result.response.text().trim();

	console.log(`[Gemini] Response: "${response}"`);

	const scores = response.split(',').map((s) => parseInt(s.trim(), 10));

	if (scores.length !== allComparisons.length) {
		throw new Error(`Expected ${allComparisons.length} scores, got ${scores.length}: "${response}"`);
	}

	const results = new Map<string, number>();
	for (let i = 0; i < allComparisons.length; i++) {
		const score = scores[i];
		if (isNaN(score) || score < 0 || score > 100) {
			throw new Error(`Invalid score at position ${i + 1}: "${scores[i]}"`);
		}
		results.set(allComparisons[i].id, score);
	}

	return results;
}
