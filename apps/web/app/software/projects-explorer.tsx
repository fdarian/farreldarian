'use client'

import { ArchiveIcon } from '@phosphor-icons/react/dist/ssr/Archive'
import type { Project } from '@repo/api-contract'
import { debounce, parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

const searchParser = parseAsString
	.withDefault('')
	.withOptions({ limitUrlUpdates: debounce(300) })

const tagsParser = parseAsArrayOf(parseAsString).withDefault([])

/** Search + tag filter chips over an already-fetched project list, with two-line project rows (active/archived status). State lives in `?q=`/`?tags=` so the filtered view is shareable and survives refresh/back. */
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

/** Active projects show a year when known, else "active"; archived projects always show an "archv" badge plus their year. */
function statusLabel(project: Project): string {
	if (project.status === 'archived') {
		return project.year !== undefined ? String(project.year) : 'archived'
	}
	return project.year !== undefined ? String(project.year) : 'active'
}

function ProjectRow({ project }: { project: Project }) {
	const isArchived = project.status === 'archived'
	const primaryTag = project.tags[0]

	return (
		<div className={cn('space-y-1', isArchived && 'opacity-60')}>
			<div className='flex items-center gap-2 text-sm'>
				<a
					href={project.href}
					target='_blank'
					rel='noopener noreferrer'
					className='shrink-0 border-b border-border transition-colors ease-out duration-100 hover:border-foreground'
				>
					{project.name}
				</a>
				{primaryTag && (
					<span className='shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground'>
						{primaryTag}
					</span>
				)}
				{isArchived && (
					<span className='flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground'>
						<ArchiveIcon size={10} />
						archv
					</span>
				)}
				<span className='shrink-0 text-muted-foreground text-xs'>
					{statusLabel(project)}
				</span>
			</div>
			<p className='text-muted-foreground text-sm'>{project.description}</p>
		</div>
	)
}
