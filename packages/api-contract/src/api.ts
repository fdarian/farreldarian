import { HttpApi, HttpApiEndpoint, HttpApiGroup } from 'effect/unstable/httpapi'
import { ApiKeyAuth } from './auth.ts'
import {
	ActivityResponse,
	ContributionsSyncResponse,
	ProjectsQuery,
	ProjectsResponse,
} from './schemas.ts'

export class FeedGroup extends HttpApiGroup.make('feed')
	.add(
		HttpApiEndpoint.get('activity', '/activity', { success: ActivityResponse })
	)
	.add(
		HttpApiEndpoint.get('projects', '/projects', {
			query: ProjectsQuery,
			success: ProjectsResponse,
		})
	)
	.middleware(ApiKeyAuth) {}

/** Sync trigger for the `contributions` sqlite mirror — see `ContributionsSyncResponse`. */
export class ContributionsGroup extends HttpApiGroup.make('contributions')
	.add(
		HttpApiEndpoint.post('sync', '/contributions/sync', {
			success: ContributionsSyncResponse,
		})
	)
	.middleware(ApiKeyAuth) {}

export class PanelApi extends HttpApi.make('panel')
	.add(FeedGroup)
	.add(ContributionsGroup)
	.prefix('/api/v1') {}
