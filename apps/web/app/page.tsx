import { Tabs } from '@base-ui/react/tabs'
import { ArrowUpRightIcon } from '@phosphor-icons/react/ssr'
import type { ActivityItem } from '@repo/api-contract'
import NextLink from 'next/link'
import { connection } from 'next/server'
import type { AnchorHTMLAttributes } from 'react'
import { Suspense } from 'react'
import {
	type getActivity,
	getHighlights,
	memoed_getActivity,
} from '@/server/panel/fetches'
import { ActivityRow } from './components/activity-row'
import { HighlightsCard } from './components/highlights-card'
import { HomeTabs } from './components/home-tabs'
import { HomeTab } from './components/home-tabs-value'
import { TabCount } from './components/tab-count'
import { TrackedLink } from './components/tracked-link'

export default function IndexPage() {
	return (
		<>
			<HeroSection />
			<LetsConnectSection />
			<TabsSection />
		</>
	)
}

function HeroSection() {
	return (
		<section className='space-y-4'>
			<p>
				I'm an engineer. I <Link href='/software'>build things</Link> when I see
				something that could be better.
				<br />I think a lot about abstraction, philosophy, and{' '}
				<Link href='https://music.apple.com/profile/fdarian' external>
					music
				</Link>
				.
			</p>

			<p>
				Currently I work on agents at Risedle. I also advise{' '}
				<Link href='https://atur.ai' external>
					atur.ai
				</Link>{' '}
				and{' '}
				<Link href='https://artistlive.id' external>
					artistlive.id
				</Link>
				, both of which I started as technical founder.
			</p>
		</section>
	)
}

function LetsConnectSection() {
	return (
		<section className='flex items-center gap-5 mt-10'>
			<p className='text-sm text-muted-foreground font-medium'>Let's connect</p>
			<div className='h-px w-16 shrink-0 bg-border' />
			<div className='flex gap-6 text-sm'>
				<TrackedLink
					href='mailto:farrel@fdarian.com'
					target='_blank'
					rel='noopener noreferrer'
					eventName='social_link_clicked'
					eventProperties={{ platform: 'mail' }}
					className='border-b border-border transition-colors ease-out duration-100 hover:border-foreground inline-flex items-center'
				>
					Mail
				</TrackedLink>
				<TrackedLink
					href='https://www.linkedin.com/in/farreldarian/'
					target='_blank'
					rel='noopener noreferrer'
					eventName='social_link_clicked'
					eventProperties={{ platform: 'linkedin' }}
					className='border-b border-border transition-colors ease-out duration-100 hover:border-foreground inline-flex items-center'
				>
					LinkedIn
				</TrackedLink>
				<TrackedLink
					href='https://twitter.com/farreldarian'
					target='_blank'
					rel='noopener noreferrer'
					eventName='social_link_clicked'
					eventProperties={{ platform: 'x' }}
					className='border-b border-border transition-colors ease-out duration-100 hover:border-foreground inline-flex items-center'
				>
					<svg
						viewBox='593.869 607.502 11.746 12.01'
						width='12'
						height='12'
						xmlns='http://www.w3.org/2000/svg'
						className='shrink-0'
						aria-label='X'
					>
						<path
							d='M600.963 612.755L604.748 608.655h-0.896L600.564 612.216 597.939 608.655H594.91l3.971 5.383L594.91 618.338h0.897l3.471-3.76 2.774 3.76H605.08L600.963 612.755h0ZM599.734 614.086l-0.403-0.537-3.2-4.266h1.377l2.583 3.444 0.403 0.536 3.358 4.475H602.474L599.734 614.086v0Z'
							fill='currentColor'
						/>
					</svg>
				</TrackedLink>
				<TrackedLink
					href='https://github.com/fdarian'
					target='_blank'
					rel='noopener noreferrer'
					eventName='social_link_clicked'
					eventProperties={{ platform: 'github' }}
					className='border-b border-border transition-colors ease-out duration-100 hover:border-foreground inline-flex items-center'
				>
					Github
				</TrackedLink>
			</div>
		</section>
	)
}

function TabsSection() {
	return (
		<HomeTabs>
			<Tabs.List className='flex items-center gap-3'>
				<Tab
					title='Projects'
					value={HomeTab.Projects}
					number={
						<Suspense fallback={null}>
							<ActivityCount />
						</Suspense>
					}
				/>
				<Tab
					title='Experience'
					value={HomeTab.Experience}
					number={
						<Suspense fallback={null}>
							<ExperienceYears />
						</Suspense>
					}
				/>
				<Tab
					title='Talks'
					value={HomeTab.Talks}
					number={<TabCount>2</TabCount>}
				/>
			</Tabs.List>

			<div className='h-[0.5px] w-full bg-border' />

			<ProjectsTab />
			<ExperienceTab />
			<TalksTab />
		</HomeTabs>
	)
}

function ProjectsTab() {
	return (
		<Tabs.Panel value={HomeTab.Projects} className='space-y-6'>
			<Suspense fallback={null}>
				<HighlightsSection />
			</Suspense>
			<Suspense
				fallback={
					<p className='text-sm text-muted-foreground'>Loading activity…</p>
				}
			>
				<ProjectsSection />
			</Suspense>
		</Tabs.Panel>
	)
}

function ExperienceTab() {
	return (
		<Tabs.Panel value={HomeTab.Experience} className='space-y-4'>
			<Experience
				year='2023 - Present'
				place='Risedle'
				title='On the side, I participated in building market and sentiment intelligence systems'
			/>
			<Experience
				year='2024 - 2026'
				place='AturAI'
				title='Born from personal frustration, I initiated a legal knowledge base startup'
			/>
			<Experience
				place='Netra'
				year='2022 - 2025'
				title='Drawn into the startup world early, I was the founding engineer building a blockchain-based royalty distribution system along with several other innovations for the music industry'
			/>
			<Experience
				place='GDP Labs'
				year='2021 - 2022'
				title='My first contribution to the tech industry as a blockchain engineer and researcher'
			/>
			<Experience
				place='Binus University'
				year='2019 - 2021'
				title='While pursuing my degree, I started my career teaching as a lab assistant'
			/>
		</Tabs.Panel>
	)
}

function TalksTab() {
	return (
		<Tabs.Panel value={HomeTab.Talks} className='space-y-4'>
			<Talks
				place='Berlin'
				year='2022'
				event='AsiaBerlin'
				title='Building the future with Music & Healthcare - the Indonesia way'
				link='https://www.youtube.com/watch?t=19891&v=B4GdwBBQUQs&feature=youtu.be'
			/>
			<Talks
				place='Virtual'
				year='2021'
				event='Beyond B'
				title='Smart Contract Programming with Solidity'
				link='https://www.kaskus.co.id/thread/610ba83e5263da119c5945c3/gagal-paham-dengan-crypto-join-webinar-beyond-b--how-crypto-works-under-the-hood/'
			/>
		</Tabs.Panel>
	)
}

/** Isolated so a GitHub outage only degrades the Activity tab — Experience/Talks render regardless. */
async function ProjectsSection() {
	let activity: Awaited<ReturnType<typeof getActivity>>
	try {
		// getActivity() can throw synchronously (missing credentials) as well as
		// reject asynchronously (network/API failure) — try/catch covers both,
		// a `.catch()` chain would only cover the latter.
		activity = await memoed_getActivity()
	} catch {
		return (
			<p className='text-sm text-muted-foreground'>
				Couldn't load activity right now.
			</p>
		)
	}

	if (activity.projects.length === 0 && activity.openSource.length === 0) {
		return <p className='text-sm text-muted-foreground'>No recent activity.</p>
	}

	return (
		<>
			<ProjectsGroup
				title='Activity'
				seeAllLabel='All projects'
				seeAllHref='/software'
				items={activity.projects.slice(0, 3)}
			/>
			<ProjectsGroup
				title='Open Source'
				seeAllLabel='All contributions'
				seeAllHref='/software?tab=contributions'
				items={activity.openSource.slice(0, 3)}
			/>
		</>
	)
}

/** Isolated so a highlights fetch failure doesn't block the Activity/Open Source groups from rendering. */
async function HighlightsSection() {
	try {
		const highlights = await getHighlights()
		return <HighlightsCard highlights={highlights} />
	} catch {
		return null
	}
}

/** Same cached fetch as ActivitySection (deduped via cache()) — degrades to no badge rather than a fake count. */
async function ActivityCount() {
	try {
		const activity = await memoed_getActivity()
		return (
			<TabCount>
				{activity.projects.length + activity.openSource.length}
			</TabCount>
		)
	} catch {
		return null
	}
}

/** Isolated so the current year (unknowable at cache/build time) doesn't force the whole page dynamic. */
async function ExperienceYears() {
	await connection()
	return <TabCount>{new Date().getUTCFullYear() - 2021}y</TabCount>
}

function ProjectsGroup(props: {
	title: string
	seeAllLabel: string
	seeAllHref: string
	items: ActivityItem[]
}) {
	if (props.items.length === 0) return null

	return (
		<div className='space-y-2'>
			<div className='flex items-center justify-between'>
				<p className='text-sm text-muted-foreground font-medium'>
					{props.title}
				</p>
				<NextLink
					href={props.seeAllHref}
					className='border-b border-border text-sm transition-colors ease-out duration-100 hover:border-foreground inline-flex items-center gap-1'
				>
					<span>{props.seeAllLabel}</span>
					<ArrowUpRightIcon className='size-3' />
				</NextLink>
			</div>
			<div className='space-y-3'>
				{props.items.map((item) => (
					<ActivityRow key={item.href} item={item} />
				))}
			</div>
		</div>
	)
}

function Talks(props: {
	place: string
	year: string
	event: string
	title: string
	link: string
}) {
	return (
		<div>
			<div className='flex items-center gap-3 text-sm text-muted-foreground font-medium'>
				<p>
					— {props.place}, {props.year}
				</p>
				<p>{props.event}</p>

				<TrackedLink
					href={props.link}
					target='_blank'
					rel='noopener noreferrer'
					eventName='talk_watched'
					eventProperties={{
						talk_title: props.title,
						talk_event: props.event,
						talk_year: props.year,
					}}
					className='border-b border-border text-xs transition-colors ease-out duration-100 hover:border-foreground'
				>
					Watch talk
				</TrackedLink>
			</div>
			<p>{props.title}</p>
		</div>
	)
}

function Experience(props: { place: string; year?: string; title: string }) {
	return (
		<div>
			<div className='flex items-center gap-3 text-sm text-muted-foreground font-medium'>
				<p>— {props.place}</p>
				<p>{props.year}</p>
			</div>
			<p>{props.title}</p>
		</div>
	)
}

function Tab(props: {
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

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
	external?: boolean
}

function Link({ children, external, ...rest }: LinkProps) {
	return (
		<a
			className='border-b border-border transition-colors ease-out duration-100 hover:border-foreground inline-flex items-center'
			{...(external && {
				target: '_blank',
				rel: 'noopener noreferrer',
			})}
			{...rest}
		>
			{children}
		</a>
	)
}
