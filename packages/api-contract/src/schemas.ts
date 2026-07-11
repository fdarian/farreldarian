import { Schema } from 'effect'

/** One row of the activity feed — a merged PR/issue on a personal project or an open-source contribution. */
export class ActivityItem extends Schema.Class<ActivityItem>('ActivityItem')({
	title: Schema.String,
	href: Schema.String,
	description: Schema.String,
	repo: Schema.String,
	updatedAt: Schema.String,
	number: Schema.optional(Schema.Number),
	externalUrl: Schema.optional(Schema.String),
}) {}

export class ActivityResponse extends Schema.Class<ActivityResponse>(
	'ActivityResponse'
)({
	projects: Schema.Array(ActivityItem),
	openSource: Schema.Array(ActivityItem),
}) {}

export class Project extends Schema.Class<Project>('Project')({
	name: Schema.String,
	href: Schema.String,
	description: Schema.String,
	tags: Schema.Array(Schema.String),
	status: Schema.Literals(['active', 'archived']),
	year: Schema.optional(Schema.Number),
	updatedAt: Schema.optional(Schema.String),
	// Both optional — a repo only has these once it's been (re-)synced from
	// GitHub; omitted rather than defaulted to 0/an epoch date for repos that
	// haven't yet.
	stars: Schema.optional(Schema.Number),
	pushedAt: Schema.optional(Schema.String),
}) {}

export class ProjectsQuery extends Schema.Class<ProjectsQuery>('ProjectsQuery')(
	{
		search: Schema.optional(Schema.String),
		tags: Schema.optional(Schema.Array(Schema.String)),
	}
) {}

export const ProjectsResponse = Schema.Array(Project)

/** One repo carrying a pinned tag, in that tag's project-priority order. */
export class HighlightProject extends Schema.Class<HighlightProject>(
	'HighlightProject'
)({
	name: Schema.String,
	description: Schema.String,
	href: Schema.String,
}) {}

/** A pinned tag, rendered as a Highlight tab on the web. */
export class Highlight extends Schema.Class<Highlight>('Highlight')({
	tag: Schema.String,
	description: Schema.optional(Schema.String),
	projects: Schema.Array(HighlightProject),
}) {}

export const HighlightsResponse = Schema.Array(Highlight)

/**
 * `mode: 'incremental'` — the common daily-cron path, ran synchronously;
 * `synced` is the number of PRs upserted. `mode: 'backfill-started'` — the
 * table was empty, so the (slow, rate-limited) full history backfill was
 * kicked off in the background instead of blocking the request; `synced` is
 * always 0 in that case.
 */
export class ContributionsSyncResponse extends Schema.Class<ContributionsSyncResponse>(
	'ContributionsSyncResponse'
)({
	mode: Schema.Literals(['incremental', 'backfill-started']),
	synced: Schema.Number,
}) {}
