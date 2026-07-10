import { Tabs } from '@base-ui/react/tabs'
import { CaretDoubleRightIcon } from '@phosphor-icons/react/dist/ssr/CaretDoubleRight'
import { getActivity, listProjects } from '@/lib/panel'
import { ActivityRow } from '../components/activity-row'
import { ProjectsExplorer } from './projects-explorer'

// Backed by a live panel API — can't be known at build time.
export const dynamic = 'force-dynamic'

export default async function SoftwarePage() {
	const [projects, activity] = await Promise.all([
		listProjects(),
		getActivity(),
	])

	return (
		<Tabs.Root
			defaultValue='projects'
			render={<section className='space-y-4' />}
		>
			<div className='space-y-2'>
				<Tabs.List className='flex items-center gap-4'>
					<SubTab value='projects' title='Projects' />
					<SubTab value='contributions' title='Contributions' />
				</Tabs.List>
				<div className='h-[0.5px] w-full bg-border' />
			</div>

			<Tabs.Panel value='projects' className='space-y-4'>
				<p className='text-sm text-muted-foreground'>
					Things I've built — mostly tools that make my own workflow better.
				</p>
				<ProjectsExplorer projects={projects} />
			</Tabs.Panel>

			<Tabs.Panel value='contributions' className='space-y-3'>
				{activity.openSource.length === 0 ? (
					<p className='text-sm text-muted-foreground'>No contributions yet.</p>
				) : (
					activity.openSource.map((item) => (
						<ActivityRow key={item.href} item={item} />
					))
				)}
			</Tabs.Panel>
		</Tabs.Root>
	)
}

function SubTab(props: { value: string; title: string }) {
	return (
		<Tabs.Tab
			value={props.value}
			className='group flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground data-active:text-foreground'
		>
			<CaretDoubleRightIcon
				size={12}
				className='hidden text-orange-500 group-data-active:inline'
			/>
			{props.title}
		</Tabs.Tab>
	)
}
