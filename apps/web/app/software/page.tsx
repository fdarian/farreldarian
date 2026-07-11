import { Tabs } from '@base-ui/react/tabs'
import { CaretDoubleRightIcon } from '@phosphor-icons/react/dist/ssr/CaretDoubleRight'
import { cache, Suspense } from 'react'
import { getActivity, listProjects } from '@/lib/panel'
import { ActivityRow } from '../components/activity-row'
import { TabCount } from '../components/tab-count'
import { ProjectsExplorer } from './projects-explorer'
import { SoftwareTabs } from './software-tabs'

// Both a section and its tab's count badge need this — cache() dedupes
// the fetch to a single call per request instead of two independent round-trips.
const getCachedProjects = cache(listProjects)
const getCachedActivity = cache(getActivity)

export default function SoftwarePage() {
	return (
		// SoftwareTabs reads the `?tab=` search param (via nuqs) — a Suspense
		// boundary lets the rest of the shell prerender instead of the whole
		// route being pulled into on-demand rendering.
		<Suspense fallback={null}>
			<SoftwareTabs>
				{/* The -mt-5 is to cancel the pt-5 we use for the handle after it's sticky */}
				<div className='space-y-2 sticky top-0 -mt-5 pt-5 bg-background'>
					<Tabs.List className='flex items-center gap-4'>
						<SubTab
							value='projects'
							title='Projects'
							number={
								<Suspense fallback={null}>
									<ProjectsCount />
								</Suspense>
							}
						/>
						<SubTab
							value='contributions'
							title='Contributions'
							number={
								<Suspense fallback={null}>
									<ContributionsCount />
								</Suspense>
							}
						/>
					</Tabs.List>
					<div className='h-[0.5px] w-full bg-border' />
				</div>
				<Tabs.Panel value='projects' className='space-y-4'>
					<Suspense
						fallback={
							<p className='text-sm text-muted-foreground'>Loading projects…</p>
						}
					>
						<ProjectsSection />
					</Suspense>
				</Tabs.Panel>
				<Tabs.Panel value='contributions' className='space-y-3'>
					<Suspense
						fallback={
							<p className='text-sm text-muted-foreground'>
								Loading contributions…
							</p>
						}
					>
						<ContributionsSection />
					</Suspense>
				</Tabs.Panel>
			</SoftwareTabs>
		</Suspense>
	)
}

/** Isolated so a GitHub outage never blocks the sqlite-backed Projects tab. */
async function ProjectsSection() {
	let projects: Awaited<ReturnType<typeof listProjects>>
	try {
		// listProjects() can throw synchronously (missing credentials) as well as
		// reject asynchronously (network/API failure) — try/catch covers both,
		// a `.catch()` chain would only cover the latter.
		projects = await getCachedProjects()
	} catch {
		return (
			<p className='text-sm text-muted-foreground'>
				Couldn't load projects right now.
			</p>
		)
	}

	return <ProjectsExplorer projects={projects} />
}

/** Isolated so a GitHub outage only degrades the Contributions tab. */
async function ContributionsSection() {
	let activity: Awaited<ReturnType<typeof getActivity>>
	try {
		activity = await getCachedActivity()
	} catch {
		return (
			<p className='text-sm text-muted-foreground'>
				Couldn't load contributions right now.
			</p>
		)
	}

	if (activity.openSource.length === 0) {
		return (
			<p className='text-sm text-muted-foreground'>No contributions yet.</p>
		)
	}

	return (
		<>
			{activity.openSource.map((item) => (
				<ActivityRow key={item.href} item={item} />
			))}
		</>
	)
}

/** Same cached fetch as ProjectsSection (deduped via cache()) — degrades to no badge rather than a fake count. */
async function ProjectsCount() {
	try {
		const projects = await getCachedProjects()
		return <TabCount>{projects.length}</TabCount>
	} catch {
		return null
	}
}

/** Same cached fetch as ContributionsSection (deduped via cache()) — degrades to no badge rather than a fake count. */
async function ContributionsCount() {
	try {
		const activity = await getCachedActivity()
		return <TabCount>{activity.openSource.length}</TabCount>
	} catch {
		return null
	}
}

function SubTab(props: {
	value: string
	title: string
	number?: React.ReactNode
}) {
	return (
		<Tabs.Tab
			value={props.value}
			className='group flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground data-active:text-foreground'
		>
			<span className='font-medium'>{props.title}</span>
			{props.number}
		</Tabs.Tab>
	)
}
