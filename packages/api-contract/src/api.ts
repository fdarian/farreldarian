import { HttpApi, HttpApiEndpoint, HttpApiGroup } from 'effect/unstable/httpapi'
import { ApiKeyAuth } from './auth.ts'
import { ActivityResponse, ProjectsQuery, ProjectsResponse } from './schemas.ts'

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

export class PanelApi extends HttpApi.make('panel')
	.add(FeedGroup)
	.prefix('/api/v1') {}
