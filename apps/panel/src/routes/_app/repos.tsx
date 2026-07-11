import { createFileRoute, useRouter } from '@tanstack/react-router'
import { SearchIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
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
	listRepos,
	setRepoPersonal,
	setRepoStatus,
	setRepoTags,
} from '#/server/repos/repos.functions.ts'

export const Route = createFileRoute('/_app/repos')({
	loader: () => listRepos(),
	component: ReposPage,
})

type Repo = Awaited<ReturnType<typeof listRepos>>[number]

function matchesSearch(repo: Repo, query: string) {
	const term = query.trim().toLowerCase()
	if (term === '') return true
	return (
		repo.name.toLowerCase().includes(term) ||
		repo.owner.toLowerCase().includes(term)
	)
}

function ReposPage() {
	const repos = Route.useLoaderData()
	const router = useRouter()
	const refresh = () => router.invalidate()
	const [search, setSearch] = useState('')

	const visibleRepos = repos.filter((repo) => matchesSearch(repo, search))
	const tagSuggestions = useMemo(
		() => Array.from(new Set(repos.flatMap((repo) => repo.tags))).sort(),
		[repos]
	)

	return (
		<div className='mx-auto max-w-3xl space-y-6 p-6'>
			<h1 className='font-semibold text-xl'>Repos</h1>
			<p className='text-muted-foreground text-sm'>
				Toggle which GitHub repos count as personal projects.
			</p>
			<Input
				className='max-w-xs'
				onChange={(e) => setSearch(e.target.value)}
				placeholder='Search by name or owner…'
				value={search}
			/>
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

function RepoRow(props: {
	repo: Repo
	tagSuggestions: ReadonlyArray<string>
	onSaved: () => void
}) {
	const { repo } = props

	return (
		<div className='flex flex-col gap-3 p-4'>
			<div className='flex items-center justify-between gap-4'>
				<div>
					<p className='font-medium text-sm'>
						{repo.owner}/{repo.name}
					</p>
					{repo.description && (
						<p className='text-muted-foreground text-sm'>{repo.description}</p>
					)}
				</div>
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
			</div>
			{repo.isPersonalProject && (
				<div className='flex flex-wrap items-center gap-2'>
					<TagsCombobox
						onChange={async (tags) => {
							await setRepoTags({ data: { id: repo.id, tags } })
							props.onSaved()
						}}
						suggestions={props.tagSuggestions}
						tags={repo.tags}
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

	return (
		<Combobox
			items={props.suggestions}
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
							{tag}
						</ComboboxItem>
					)}
				</ComboboxList>
				{isNewTag && (
					<ComboboxItem value={trimmedQuery}>Add "{trimmedQuery}"</ComboboxItem>
				)}
			</ComboboxPopup>
		</Combobox>
	)
}
