export const HomeTab = {
	Projects: 'projects',
	Experience: 'exp',
	Talks: 'talks',
} as const

export type HomeTab = (typeof HomeTab)[keyof typeof HomeTab]
