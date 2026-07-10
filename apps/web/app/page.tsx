import { Tabs } from '@base-ui/react/tabs'
import type { AnchorHTMLAttributes } from 'react'

export default function IndexPage() {
	return (
		<>
			<section className='space-y-4'>
				<p className='font-serif text-lg font-medium'>
					Farrel Darian, compulsive builder, engineer. / Currently exploring how
					philosophical principles guide the design of intelligent systems.
				</p>

				{/*<p>
          Currently building{' '}
          <Link href='https://netra.live' external>
            Netra
          </Link>{' '}
          as CTO. Previously at{' '}
          <Link href='https://www.gdplabs.id/' external>
            GDP Labs
          </Link>
          .
        </p>*/}
			</section>

			<section className='flex gap-6 text-lg flex-wrap'>
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
				defaultValue='projects'
				render={<section className='space-y-2' />}
			>
				<Tabs.List className='flex items-center gap-3'>
					<Tab title='Projects' value='projects' number='5' />
					<Tab
						title='Experience'
						value='exp'
						number={`${new Date().getUTCFullYear() - 2021}y`}
					/>
					<Tab title='Talks' value='talks' number='2' />
				</Tabs.List>

				<Tabs.Panel value='projects' className='space-y-4'>
					<Project
						name='better-pm'
						href='https://github.com/fdarian/better-pm'
						description='Shortcut package manager CLI for all projects, replacing switching between pnpm and bun'
					/>
					<Project
						name='agent-dash'
						href='https://github.com/fdarian/agent-dash'
						description='Easier way to manage multiple Claude Code sessions'
					/>
					<Project
						name='tmux-sessions'
						href='https://github.com/fdarian/tmux-sessions'
						description='A better default tmux session switcher, batteries included'
					/>
					<Project
						name='ff'
						href='https://github.com/fdarian/ff'
						description='A set of reusable utilities, covering AI SDK and Effect TS'
					/>
					<Project
						name='lazygit.nvim'
						href='https://github.com/fdarian/lazygit.nvim'
						description='Lazygit integration in Neovim that works as expected'
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

			{/*<Section title='Music' className='flex items-center gap-6'>
        <Link href='https://soundcloud.com/dearen' external>
          Soundcloud
        </Link>
        <Link href='https://music.apple.com/profile/farreldarian' external>
          Apple Music
        </Link>
      </Section>*/}
		</>
	)
}

function Project(props: { name: string; href: string; description: string }) {
	return (
		<div>
			<div className='flex items-center gap-3 text-sm text-muted-foreground'>
				<a
					href={props.href}
					target='_blank'
					rel='noopener noreferrer'
					className='border-b border-border hover:border-foreground transition-colors ease-out duration-100'
				>
					{props.name}
				</a>
			</div>
			<p className='font-medium'>{props.description}</p>
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
					className='border-b border-border hover:border-foreground transition-colors ease-out duration-100 text-xs'
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
			className='text-sm text-muted-foreground data-active:text-foreground cursor-pointer flex items-center gap-1.5'
		>
			<span>{props.title}</span>
			<span className='text-[10px] text-muted-foreground rounded-full bg-muted border-[0.5px] border-border leading-[10px] px-1 py-0.5'>
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
			className='border-b border-border hover:border-foreground transition-colors ease-out duration-100 text-sm'
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
