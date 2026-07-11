import { createFileRoute, useRouter } from '@tanstack/react-router'
import {
	listOpenSourceOrgs,
	setOrgExcluded,
} from '#/server/contributions/contributions.functions.ts'

export const Route = createFileRoute('/_app/contributions')({
	loader: () => listOpenSourceOrgs(),
	component: ContributionsPage,
})

type Org = Awaited<ReturnType<typeof listOpenSourceOrgs>>[number]

function ContributionsPage() {
	const orgs = Route.useLoaderData()
	const router = useRouter()
	const refresh = () => router.invalidate()

	return (
		<div className='mx-auto max-w-3xl space-y-6 p-6'>
			<h1 className='font-semibold text-xl'>Contributions</h1>
			<p className='text-muted-foreground text-sm'>
				Exclude an org's PRs from the Open Source activity feed. Personal
				projects and repos I own are never affected — this only hides external
				orgs, detected from what's actually been synced.
			</p>
			<div className='divide-y rounded-lg border'>
				{orgs.map((org) => (
					<OrgRow key={org.owner} org={org} onSaved={refresh} />
				))}
				{orgs.length === 0 && (
					<p className='p-4 text-muted-foreground text-sm'>
						No open-source orgs detected yet — run a contributions sync first.
					</p>
				)}
			</div>
		</div>
	)
}

function OrgRow(props: { org: Org; onSaved: () => void }) {
	const { org } = props

	return (
		<div className='flex items-center justify-between gap-4 p-4'>
			<p className='font-medium text-sm'>{org.owner}</p>
			<label className='flex items-center gap-2 text-sm'>
				<input
					type='checkbox'
					checked={org.excluded}
					onChange={async () => {
						await setOrgExcluded({
							data: { owner: org.owner, excluded: !org.excluded },
						})
						props.onSaved()
					}}
				/>
				Excluded
			</label>
		</div>
	)
}
