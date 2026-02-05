export const questions = [
	{
		id: 1,
		text: 'What grade are you in?',
		weight: 2.5, // high - same grade = easier to hang out
		allowOther: false,
		options: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
	},
	{
		id: 2,
		text: 'Favourite music genre?',
		weight: 1.5,
		allowOther: false,
		options: ['Hip Hop & R&B', 'Pop', 'Rock', 'Country', 'Electronic']
	},
	{
		id: 3,
		text: 'Hobbies?',
		weight: 2.5, // highest - this is what you'd actually do together
		allowOther: true,
		options: ['Gaming', 'Reading', 'Sports', 'Art & Music', 'Watching TV']
	},
	{
		id: 4,
		text: 'Favourite colour?',
		weight: 0.5, // lowest - pretty superficial for friendship
		allowOther: false,
		options: ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Pink']
	},
	{
		id: 5,
		text: 'Favourite food?',
		weight: 1.5,
		allowOther: true,
		options: ['Italian', 'Chinese', 'Japanese', 'Mexican', 'Indian', 'Korean', 'American']
	},
	{
		id: 6,
		text: 'Favourite TV show or movie?',
		weight: 2.0, // high - shared entertainment for hangouts
		allowOther: true,
		options: ['Comedy', 'Drama', 'Action', 'Horror', 'Sci-Fi', 'Romance', 'Documentary', 'Anime']
	},
	{
		id: 7,
		text: 'Favourite holiday?',
		weight: 0.75,
		allowOther: true,
		options: ['Christmas', 'Halloween', 'Easter', 'New Year']
	},
	{
		id: 8,
		text: 'How do you like to hang out?',
		weight: 2.5, // critical - directly determines compatibility
		allowOther: false,
		options: ['Chill at home', 'Go out', 'Active/outdoors', 'Study together']
	},
	{
		id: 9,
		text: "What's your vibe?",
		weight: 1.5, // personality match matters but opposites can work
		allowOther: false,
		options: ['Introvert', 'Extrovert', 'Ambivert']
	},
	{
		id: 10,
		text: 'When are you most active?',
		weight: 1.25, // practical for scheduling but flexible
		allowOther: false,
		options: ['Morning person', 'Night owl', 'Afternoon']
	},
	{
		id: 11,
		text: 'How do you prefer to communicate?',
		weight: 1.5, // important for maintaining the friendship
		allowOther: false,
		options: ['Texting', 'Calling', 'In person', 'Memes & reels']
	},
	{
		id: 12,
		text: "On weekends, you're usually...",
		weight: 2.0, // lifestyle compatibility
		allowOther: false,
		options: ['Sleeping in', 'Out with friends', 'Catching up on work', 'Family time']
	}
] as const;

export type Question = (typeof questions)[number];

type SimilarityMap = Record<string, Record<string, number>>;

const similarityMaps: Record<number, SimilarityMap> = {
	// 1: Grade - no similarity map (exact match only)
	2: { // Music
		'Hip Hop & R&B': { 'Pop': 0.6, 'Electronic': 0.5 },
		'Pop': { 'Hip Hop & R&B': 0.6, 'Rock': 0.5, 'Electronic': 0.5, 'Country': 0.3 },
		'Rock': { 'Pop': 0.5, 'Country': 0.4 },
		'Country': { 'Rock': 0.4, 'Pop': 0.3 },
		'Electronic': { 'Hip Hop & R&B': 0.5, 'Pop': 0.5 }
	},
	3: { // Hobbies
		'Gaming': { 'Watching TV': 0.5, 'Sports': 0.3 },
		'Reading': { 'Art & Music': 0.4, 'Watching TV': 0.4 },
		'Sports': { 'Gaming': 0.3 },
		'Art & Music': { 'Reading': 0.4, 'Watching TV': 0.4 },
		'Watching TV': { 'Gaming': 0.5, 'Reading': 0.4, 'Art & Music': 0.4 }
	},
	4: { // Colours (spectrum adjacency + warm/cool groupings)
		'Red': { 'Orange': 0.7, 'Pink': 0.6, 'Purple': 0.4 },
		'Orange': { 'Red': 0.7, 'Yellow': 0.7 },
		'Yellow': { 'Orange': 0.7, 'Green': 0.6 },
		'Green': { 'Yellow': 0.6, 'Blue': 0.6 },
		'Blue': { 'Green': 0.6, 'Purple': 0.7 },
		'Purple': { 'Blue': 0.7, 'Pink': 0.7, 'Red': 0.4 },
		'Pink': { 'Purple': 0.7, 'Red': 0.6 }
	},
	5: { // Food (regional/flavor profile similarities)
		'Chinese': { 'Japanese': 0.7, 'Korean': 0.7 },
		'Japanese': { 'Chinese': 0.7, 'Korean': 0.7 },
		'Korean': { 'Chinese': 0.7, 'Japanese': 0.7 },
		'Mexican': { 'American': 0.4, 'Indian': 0.4 },
		'Italian': { 'American': 0.4 },
		'American': { 'Italian': 0.4, 'Mexican': 0.4 },
		'Indian': { 'Mexican': 0.4 }
	},
	6: { // TV/Movie (genre overlaps)
		'Comedy': { 'Romance': 0.5, 'Anime': 0.4 },
		'Drama': { 'Romance': 0.6, 'Documentary': 0.4 },
		'Action': { 'Sci-Fi': 0.6, 'Anime': 0.4 },
		'Horror': { 'Sci-Fi': 0.4 },
		'Sci-Fi': { 'Action': 0.6, 'Horror': 0.4, 'Anime': 0.5 },
		'Romance': { 'Drama': 0.6, 'Comedy': 0.5 },
		'Documentary': { 'Drama': 0.4 },
		'Anime': { 'Sci-Fi': 0.5, 'Action': 0.4, 'Comedy': 0.4 }
	},
	7: { // Holidays
		'Christmas': { 'New Year': 0.7, 'Easter': 0.5 },
		'Halloween': { 'Easter': 0.3 },
		'Easter': { 'Christmas': 0.5, 'Halloween': 0.3 },
		'New Year': { 'Christmas': 0.7 }
	},
	8: { // How do you like to hang out?
		'Chill at home': { 'Study together': 0.6, 'Go out': 0.3, 'Active/outdoors': 0.2 },
		'Go out': { 'Active/outdoors': 0.7, 'Study together': 0.3 },
		'Active/outdoors': { 'Study together': 0.3 },
		'Study together': {}
	},
	9: { // What's your vibe? (ambivert bridges both)
		'Introvert': { 'Ambivert': 0.7, 'Extrovert': 0.4 },
		'Extrovert': { 'Ambivert': 0.7 },
		'Ambivert': {}
	},
	10: { // When are you most active? (adjacent times overlap)
		'Morning person': { 'Afternoon': 0.6, 'Night owl': 0.2 },
		'Afternoon': { 'Night owl': 0.6 },
		'Night owl': {}
	},
	11: { // Communication style
		'Texting': { 'Memes & reels': 0.7, 'Calling': 0.5, 'In person': 0.4 },
		'Calling': { 'In person': 0.6, 'Memes & reels': 0.3 },
		'In person': { 'Memes & reels': 0.3 },
		'Memes & reels': {}
	},
	12: { // Weekend lifestyle
		'Sleeping in': { 'Family time': 0.5, 'Catching up on work': 0.4, 'Out with friends': 0.2 },
		'Out with friends': { 'Family time': 0.4, 'Catching up on work': 0.2 },
		'Catching up on work': { 'Family time': 0.4 },
		'Family time': {}
	}
};

export function getOptionSimilarity(questionId: number, optionA: string, optionB: string): number {
	if (optionA === optionB) return 1;
	const map = similarityMaps[questionId];
	if (!map) return 0;
	return map[optionA]?.[optionB] ?? map[optionB]?.[optionA] ?? 0;
}
