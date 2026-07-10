import { Tabs } from '@base-ui/react/tabs'
import type { ActivityItem } from '@repo/api-contract'
import NextLink from 'next/link'
import type { AnchorHTMLAttributes } from 'react'
import { getActivity } from '@/lib/panel'
import { ActivityRow } from './components/activity-row'

// Activity is backed by a live panel API — can't be known at build time.
export const dynamic = 'force-dynamic'

export default async function IndexPage() {
	const activity = await getActivity()

	return (
		<>
			<section className='space-y-4'>
				<p className='font-serif text-lg font-medium'>
					Farrel Darian, compulsive builder, engineer. / Currently exploring how
					philosophical principles guide the design of intelligent systems.
				</p>

				<p>
					I'm an engineer, I build things when I see something that could be
					better. I think a lot about abstraction, philosophy, and music.
				</p>

				<p>
					I work on agents at Risedle. I also advise{' '}
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

			<section className='flex flex-wrap gap-6 text-lg'>
				<Link href='mailto:farrel@fdarian.com' external>
					Mail
				</Link>
				<Link href='https://www.linkedin.com/in/farreldarian/' external>
					LinkedIn
				</Link>
				<Link href='https://twitter.com/farreldarian' external>
					X
				</Link>
				<Link href='https://github.com/fdarian' external>
					Github
				</Link>
			</section>

			<Tabs.Root
				defaultValue='activity'
				render={<section className='space-y-2' />}
			>
				<Tabs.List className='flex items-center gap-3'>
					<Tab
						title='Activity'
						value='activity'
						number={activity.projects.length + activity.openSource.length}
					/>
					<Tab
						title='Experience'
						value='exp'
						number={`${new Date().getUTCFullYear() - 2021}y`}
					/>
					<Tab title='Talks' value='talks' number='2' />
				</Tabs.List>
				<div className='h-[0.5px] w-full bg-border' />

				<Tabs.Panel value='activity' className='space-y-6'>
					<ActivityGroup
						title='Projects'
						seeAllLabel='All projects'
						seeAllHref='/software'
						items={activity.projects.slice(0, 3)}
					/>
					<ActivityGroup
						title='Open Source'
						seeAllLabel='All contributions'
						seeAllHref='/software'
						items={activity.openSource.slice(0, 3)}
					/>
				</Tabs.Panel>

				<Tabs.Panel value='talks' className='space-y-4'>
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

				<Tabs.Panel value='exp' className='space-y-4'>
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
			</Tabs.Root>
		</>
	)
}

function ActivityGroup(props: {
	title: string
	seeAllLabel: string
	seeAllHref: string
	items: ActivityItem[]
}) {
	if (props.items.length === 0) return null

	return (
		<div className='space-y-2'>
			<div className='flex items-center justify-between'>
				<p className='text-sm text-muted-foreground'>{props.title}</p>
				<NextLink
					href={props.seeAllHref}
					className='border-b border-border text-sm transition-colors ease-out duration-100 hover:border-foreground'
				>
					{props.seeAllLabel} ↗
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
			<div className='flex items-center gap-3 text-sm text-muted-foreground'>
				<p>
					— {props.place}, {props.year}
				</p>
				<p>{props.event}</p>

				<a
					target='_blank'
					rel='noopener noreferrer'
					href={props.link}
					className='border-b border-border text-xs transition-colors ease-out duration-100 hover:border-foreground'
				>
					Watch talk
				</a>
			</div>
			<p className='font-medium'>{props.title}</p>
		</div>
	)
}

function Experience(props: { place: string; year?: string; title: string }) {
	return (
		<div>
			<div className='flex items-center gap-3 text-sm text-muted-foreground'>
				<p>— {props.place}</p>
				<p>{props.year}</p>
			</div>
			<p className='font-medium'>{props.title}</p>
		</div>
	)
}

function Tab(props: { value: string; title: string; number: React.ReactNode }) {
	return (
		<Tabs.Tab
			value={props.value}
			className='flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground data-active:text-foreground'
		>
			<span>{props.title}</span>
			<span className='rounded-full border-[0.5px] border-border bg-muted px-1 py-0.5 text-[10px] text-muted-foreground leading-[10px]'>
				{props.number}{' '}
			</span>
		</Tabs.Tab>
	)
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
	external?: boolean
}

function Link({ children, external, ...rest }: LinkProps) {
	return (
		<a
			className='border-b border-border text-sm transition-colors ease-out duration-100 hover:border-foreground'
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
