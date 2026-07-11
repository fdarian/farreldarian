'use client'

import { ClockClockwiseIcon } from '@phosphor-icons/react/dist/ssr/ClockClockwise'
import { PackageIcon } from '@phosphor-icons/react/dist/ssr/Package'
import { StarIcon } from '@phosphor-icons/react/dist/ssr/Star'
import type { Project } from '@repo/api-contract'
import { debounce, parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'
import { useMemo } from 'react'
import { RelativeTime } from '@/app/components/relative-time'
import { Tooltip, TooltipPopup, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const searchParser = parseAsString
	.withDefault('')
	.withOptions({ limitUrlUpdates: debounce(300) })

const tagsParser = parseAsArrayOf(parseAsString).withDefault([])

/** Search + tag filter chips over an already-fetched project list, with two-line project rows (stars/last-updated when synced, archived status). State lives in `?q=`/`?tags=` so the filtered view is shareable and survives refresh/back. */
export function ProjectsExplorer({
	projects,
}: {
	projects: readonly Project[]
}) {
	const [search, setSearch] = useQueryState('q', searchParser)
	const [activeTags, setActiveTags] = useQueryState('tags', tagsParser)

	const activeTagSet = useMemo(() => new Set(activeTags), [activeTags])

	const tags = useMemo(
		() =>
			Array.from(new Set(projects.flatMap((project) => project.tags))).sort(),
		[projects]
	)

	const filteredProjects = useMemo(() => {
		const query = search.trim().toLowerCase()
		return projects.filter((project) => {
			const matchesQuery =
				query.length === 0 ||
				project.name.toLowerCase().includes(query) ||
				project.description.toLowerCase().includes(query)
			const matchesTags =
				activeTagSet.size === 0 ||
				project.tags.some((tag) => activeTagSet.has(tag))
			return matchesQuery && matchesTags
		})
	}, [projects, search, activeTagSet])

	function toggleTag(tag: string) {
		setActiveTags((current) =>
			current.includes(tag)
				? current.filter((activeTag) => activeTag !== tag)
				: [...current, tag]
		)
	}

	return (
		<div className='space-y-4'>
			<input
				value={search}
				onChange={(event) => setSearch(event.target.value)}
				placeholder='Search projects...'
				className='w-full border-0 border-border border-b bg-transparent pb-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground'
			/>

			{tags.length > 0 && (
				<div className='flex flex-wrap gap-2'>
					{tags.map((tag) => (
						<button
							key={tag}
							type='button'
							onClick={() => toggleTag(tag)}
							className={cn(
								'rounded-full border px-3 py-1 text-xs transition-colors',
								activeTagSet.has(tag)
									? 'border-foreground text-foreground'
									: 'border-border text-muted-foreground hover:border-foreground/50'
							)}
						>
							{tag}
						</button>
					))}
				</div>
			)}

			<div className='space-y-4'>
				{filteredProjects.map((project) => (
					<ProjectRow key={project.href} project={project} />
				))}
				{filteredProjects.length === 0 && (
					<p className='text-sm text-muted-foreground'>
						No projects match your search.
					</p>
				)}
			</div>
		</div>
	)
}

/** Only archived projects show a status label — their year when known, else "archived". Active projects show nothing. */
function statusLabel(project: Project): string | undefined {
	if (project.status !== 'archived') {
		return undefined
	}
	return project.year !== undefined ? String(project.year) : 'archived'
}

function ProjectRow({ project }: { project: Project }) {
	const isArchived = project.status === 'archived'
	const label = statusLabel(project)

	return (
		<div className={cn('space-y-1', isArchived && 'opacity-50')}>
			<div className='flex items-center gap-2 text-sm'>
				<a
					href={project.href}
					target='_blank'
					rel='noopener noreferrer'
					className='shrink-0 border-b border-border transition-colors ease-out duration-100 hover:border-foreground'
				>
					{project.name}
				</a>
				{project.tags.map((tag) => (
					<span
						key={tag}
						className='shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground border-[0.5px] border-border'
					>
						{tag}
					</span>
				))}
				{project.stars !== undefined && project.stars > 0 && (
					<Tooltip>
						<TooltipTrigger className='flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground'>
							<StarIcon size={10} />
							{project.stars}
						</TooltipTrigger>
						<TooltipPopup>starred</TooltipPopup>
					</Tooltip>
				)}
				{project.pushedAt !== undefined && (
					<Tooltip>
						<TooltipTrigger className='flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground'>
							<ClockClockwiseIcon size={10} />
							<RelativeTime iso={project.pushedAt} />
						</TooltipTrigger>
						<TooltipPopup>last updated</TooltipPopup>
					</Tooltip>
				)}
				{isArchived && (
					<span className='flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground'>
						<PackageIcon size={10} />
					</span>
				)}
				{label && (
					<span className='shrink-0 text-muted-foreground text-xs'>
						{label}
					</span>
				)}
			</div>
			<p className='text-muted-foreground text-sm'>{project.description}</p>
		</div>
	)
}
