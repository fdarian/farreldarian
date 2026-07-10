import { Config, Context, Effect, Layer, Option, Schema } from 'effect'

// `Schema.Defect` is broken in effect@4.0.0-beta.97 (crashes building the AST) —
// `Schema.Unknown` is the workaround until it's fixed upstream.
export class GithubError extends Schema.TaggedErrorClass<GithubError>()(
	'GithubError',
	{
		status: Schema.optional(Schema.Number),
		cause: Schema.Unknown,
	}
) {}

export type GithubRepo = {
	githubId: number
	owner: string
	name: string
	description: string | null
}

export type MergedPullRequest = {
	title: string
	href: string
	repo: string
	number: number
	updatedAt: string
}

type GithubApiRepo = {
	id: number
	owner: { login: string }
	name: string
	description: string | null
}

type GithubSearchIssuesResponse = {
	items: ReadonlyArray<{
		title: string
		html_url: string
		number: number
		updated_at: string
		repository_url: string
	}>
}

/** GitHub REST API client — my merged PRs and the repos I own. */
export class Github extends Context.Service<Github>()('server/github', {
	make: Effect.gen(function* () {
		// Optional at construction time — a missing token only fails the specific
		// calls that need GitHub, instead of taking down the whole shared runtime
		// (this service is part of `layerMain`, used by every request).
		const token = yield* Config.string('GITHUB_TOKEN').pipe(Config.option)
		const username = yield* Config.string('GITHUB_USERNAME').pipe(
			Config.withDefault('farreldarian')
		)

		const request = <T>(path: string) =>
			Effect.gen(function* () {
				if (Option.isNone(token)) {
					return yield* new GithubError({
						cause: 'GITHUB_TOKEN is not configured',
					})
				}

				const response = yield* Effect.tryPromise({
					try: () =>
						fetch(`https://api.github.com${path}`, {
							headers: {
								Authorization: `Bearer ${token.value}`,
								Accept: 'application/vnd.github+json',
								'X-GitHub-Api-Version': '2022-11-28',
							},
						}),
					catch: (cause) => new GithubError({ cause }),
				})

				if (!response.ok) {
					const body = yield* Effect.tryPromise({
						try: () => response.text(),
						catch: (cause) => new GithubError({ cause }),
					})
					return yield* new GithubError({
						status: response.status,
						cause: body,
					})
				}

				return yield* Effect.tryPromise({
					try: () => response.json() as Promise<T>,
					catch: (cause) => new GithubError({ cause }),
				})
			})

		const listOwnRepos = (): Effect.Effect<
			ReadonlyArray<GithubRepo>,
			GithubError
		> =>
			request<ReadonlyArray<GithubApiRepo>>(
				'/user/repos?affiliation=owner&per_page=100&sort=updated'
			).pipe(
				Effect.map((items) =>
					items.map((item) => ({
						githubId: item.id,
						owner: item.owner.login,
						name: item.name,
						description: item.description,
					}))
				)
			)

		const listMergedPullRequests = (): Effect.Effect<
			ReadonlyArray<MergedPullRequest>,
			GithubError
		> =>
			request<GithubSearchIssuesResponse>(
				`/search/issues?q=${encodeURIComponent(`author:${username} is:pr is:merged`)}&sort=updated&order=desc&per_page=30`
			).pipe(
				Effect.map((data) =>
					data.items.map((item) => ({
						title: item.title,
						href: item.html_url,
						number: item.number,
						updatedAt: item.updated_at,
						repo: item.repository_url.replace(
							'https://api.github.com/repos/',
							''
						),
					}))
				)
			)

		return { username, listOwnRepos, listMergedPullRequests }
	}),
}) {
	static layer = Layer.effect(Github, this.make)
}
