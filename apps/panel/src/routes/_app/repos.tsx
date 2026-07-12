import { createFileRoute, useRouter } from '@tanstack/react-router'
import { LoaderCircleIcon, SearchIcon } from 'lucide-react'
import { startTransition, useMemo, useOptimistic, useState } from 'react'
import { Button } from '#/components/ui/button.tsx'
import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxEmpty,
	ComboboxItem,
	ComboboxList,
	ComboboxPopup,
	ComboboxValue,
} from '#/components/ui/combobox.tsx'
import { Input } from '#/components/ui/input.tsx'
import {
	hardDeleteRepo,
	listRepos,
	setRepoPersonal,
	setRepoStatus,
	setRepoTags,
} from '#/server/repos/repos.functions.ts'
import { getSyncState, runSync } from '#/server/sync/sync.functions.ts'

export const Route = createFileRoute('/_app/repos')({
	loader: async () => ({
		repos: await listRepos(),
		syncState: await getSyncState(),
	}),
	component: ReposPage,
})

type Repo = Awaited<ReturnType<typeof listRepos>>[number]

type PersonalFilter = 'all' | 'personal' | 'not-personal'

const personalFilters: ReadonlyArray<{ value: PersonalFilter; label: string }> =
	[
		{ value: 'all', label: 'All' },
		{ value: 'personal', label: 'Personal only' },
		{ value: 'not-personal', label: 'Not personal' },
	]

function matchesSearch(repo: Repo, query: string) {
	const term = query.trim().toLowerCase()
	if (term === '') return true
	return (
		repo.name.toLowerCase().includes(term) ||
		repo.owner.toLowerCase().includes(term)
	)
}

function matchesPersonalFilter(repo: Repo, filter: PersonalFilter) {
	if (filter === 'personal') return repo.isPersonalProject
	if (filter === 'not-personal') return !repo.isPersonalProject
	return true
}

function ReposPage() {
	const loaderData = Route.useLoaderData()
	const repos = loaderData.repos
	const router = useRouter()
	const refresh = () => router.invalidate()
	const [search, setSearch] = useState('')
	const [personalFilter, setPersonalFilter] = useState<PersonalFilter>('all')
	const [isSyncing, setIsSyncing] = useState(false)
	const lastSyncedAt = loaderData.syncState.reduce<Date | null>(
		(latest, state) => {
			if (state.lastSyncedAt === null) return latest
			if (latest === null || state.lastSyncedAt > latest)
				return state.lastSyncedAt
			return latest
		},
		null
	)

	const visibleRepos = repos.filter(
		(repo) =>
			matchesSearch(repo, search) && matchesPersonalFilter(repo, personalFilter)
	)
	const tagSuggestions = useMemo(
		() => Array.from(new Set(repos.flatMap((repo) => repo.tags))).sort(),
		[repos]
	)

	return (
		<div className='mx-auto max-w-3xl space-y-6 p-6'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<h1 className='font-semibold text-xl'>Repos</h1>
				<div className='flex items-center gap-2'>
					{lastSyncedAt !== null && (
						<span className='text-muted-foreground text-sm'>
							Last synced {formatRelativeTime(lastSyncedAt)} ago
						</span>
					)}
					<Button
						disabled={isSyncing}
						onClick={async () => {
							setIsSyncing(true)
							try {
								await runSync()
								await router.invalidate()
							} finally {
								setIsSyncing(false)
							}
						}}
						type='button'
					>
						{isSyncing && <LoaderCircleIcon className='animate-spin' />}
						Sync
					</Button>
				</div>
			</div>
			<p className='text-muted-foreground text-sm'>
				Toggle which GitHub repos count as personal projects.
			</p>
			<div className='flex flex-wrap items-center gap-2'>
				<Input
					className='max-w-xs'
					onChange={(e) => setSearch(e.target.value)}
					placeholder='Search by name or owner…'
					value={search}
				/>
				<div className='flex items-center gap-1'>
					{personalFilters.map((filter) => (
						<Button
							key={filter.value}
							onClick={() => setPersonalFilter(filter.value)}
							size='sm'
							type='button'
							variant={
								personalFilter === filter.value ? 'secondary' : 'outline'
							}
						>
							{filter.label}
						</Button>
					))}
				</div>
			</div>
			<div className='divide-y rounded-lg border'>
				{visibleRepos.map((repo) => (
					<RepoRow
						key={repo.id}
						onSaved={refresh}
						repo={repo}
						tagSuggestions={tagSuggestions}
					/>
				))}
				{visibleRepos.length === 0 && (
					<p className='p-4 text-muted-foreground text-sm'>No repos found.</p>
				)}
			</div>
		</div>
	)
}

function formatRelativeTime(date: Date) {
	const elapsedSeconds = Math.floor((Date.now() - date.getTime()) / 1000)
	if (elapsedSeconds < 60) return 'just now'
	const elapsedMinutes = Math.floor(elapsedSeconds / 60)
	if (elapsedMinutes < 60) return `${elapsedMinutes}m`
	const elapsedHours = Math.floor(elapsedMinutes / 60)
	if (elapsedHours < 24) return `${elapsedHours}h`
	return `${Math.floor(elapsedHours / 24)}d`
}

function RepoRow(props: {
	repo: Repo
	tagSuggestions: ReadonlyArray<string>
	onSaved: () => void
}) {
	const repo = props.repo
	const [optimisticTags, setOptimisticTags] = useOptimistic(repo.tags)

	return (
		<div className='flex flex-col gap-3 p-4'>
			<div className='flex items-center justify-between gap-4'>
				<div>
					<p className='font-medium text-sm'>
						{repo.owner}/{repo.name}
					</p>
					{repo.deletedAt !== null && (
						<p className='text-muted-foreground text-sm'>
							deleted · hidden from web
						</p>
					)}
					{repo.description && (
						<p className='text-muted-foreground text-sm'>{repo.description}</p>
					)}
				</div>
				<div className='flex items-center gap-2'>
					<label className='flex items-center gap-2 text-sm'>
						<input
							checked={repo.isPersonalProject}
							onChange={async () => {
								await setRepoPersonal({
									data: {
										id: repo.id,
										isPersonalProject: !repo.isPersonalProject,
									},
								})
								props.onSaved()
							}}
							type='checkbox'
						/>
						Personal project
					</label>
					{repo.deletedAt !== null && (
						<Button
							onClick={async () => {
								await hardDeleteRepo({ data: { id: repo.id } })
								props.onSaved()
							}}
							size='sm'
							type='button'
							variant='outline'
						>
							Remove record
						</Button>
					)}
				</div>
			</div>
			{repo.isPersonalProject && (
				<div className='flex flex-wrap items-center gap-2'>
					<TagsCombobox
						onChange={(tags) => {
							startTransition(async () => {
								setOptimisticTags(tags)
								try {
									await setRepoTags({ data: { id: repo.id, tags } })
									props.onSaved()
								} catch (error) {
									// Not committing new loader data leaves optimisticTags to
									// revert to repo.tags once this transition settles.
									console.error('Failed to save repo tags', error)
								}
							})
						}}
						suggestions={props.tagSuggestions}
						tags={optimisticTags}
					/>
					<select
						className='h-8 rounded-md border bg-transparent px-2 text-sm'
						onChange={async (e) => {
							await setRepoStatus({
								data: {
									id: repo.id,
									status: e.target.value as 'active' | 'archived',
									year: repo.year ?? undefined,
								},
							})
							props.onSaved()
						}}
						value={repo.status}
					>
						<option value='active'>active</option>
						<option value='archived'>archived</option>
					</select>
				</div>
			)}
		</div>
	)
}

/** Multi-select tag editor: pick from tags already used elsewhere, or type a new one. */
function TagsCombobox(props: {
	tags: ReadonlyArray<string>
	suggestions: ReadonlyArray<string>
	onChange: (tags: string[]) => void
}) {
	const [query, setQuery] = useState('')
	const trimmedQuery = query.trim()
	const isNewTag =
		trimmedQuery !== '' &&
		!props.suggestions.some(
			(tag) => tag.toLowerCase() === trimmedQuery.toLowerCase()
		) &&
		!props.tags.some((tag) => tag.toLowerCase() === trimmedQuery.toLowerCase())
	// Appending the "Add …" entry into `items` (rather than rendering it as a
	// sibling after ComboboxList) makes it a real Combobox.Item registered with
	// Base UI's Composite list, so it gets arrow-key highlighting, hover, and
	// Enter-to-select for free.
	const items = isNewTag
		? [...props.suggestions, trimmedQuery]
		: props.suggestions

	return (
		<Combobox
			items={items}
			multiple
			onInputValueChange={setQuery}
			onValueChange={props.onChange}
			value={[...props.tags]}
		>
			<ComboboxChips className='h-8 w-64' startAddon={<SearchIcon />}>
				<ComboboxValue>
					{(value: string[]) => (
						<>
							{value.map((tag) => (
								<ComboboxChip aria-label={tag} key={tag}>
									{tag}
								</ComboboxChip>
							))}
							<ComboboxChipsInput
								placeholder={value.length > 0 ? undefined : 'Add tags…'}
							/>
						</>
					)}
				</ComboboxValue>
			</ComboboxChips>
			<ComboboxPopup>
				<ComboboxEmpty>No tags found.</ComboboxEmpty>
				<ComboboxList>
					{(tag: string) => (
						<ComboboxItem key={tag} value={tag}>
							{isNewTag && tag === trimmedQuery ? `Add "${tag}"` : tag}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxPopup>
		</Combobox>
	)
}
