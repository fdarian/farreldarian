import { useForm } from '@tanstack/react-form'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Button } from '#/components/ui/button.tsx'
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

function ReposPage() {
	const repos = Route.useLoaderData()
	const router = useRouter()
	const refresh = () => router.invalidate()

	return (
		<div className='mx-auto max-w-3xl space-y-6 p-6'>
			<h1 className='font-semibold text-xl'>Repos</h1>
			<p className='text-muted-foreground text-sm'>
				Toggle which GitHub repos count as personal projects.
			</p>
			<div className='divide-y rounded-lg border'>
				{repos.map((repo) => (
					<RepoRow key={repo.id} repo={repo} onSaved={refresh} />
				))}
				{repos.length === 0 && (
					<p className='p-4 text-muted-foreground text-sm'>No repos found.</p>
				)}
			</div>
		</div>
	)
}

function RepoRow(props: { repo: Repo; onSaved: () => void }) {
	const { repo } = props

	const tagsForm = useForm({
		defaultValues: { tags: repo.tags.join(', ') },
		onSubmit: async ({ value }) => {
			const tags = value.tags
				.split(',')
				.map((tag) => tag.trim())
				.filter(Boolean)
			await setRepoTags({ data: { id: repo.id, tags } })
			props.onSaved()
		},
	})

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
						type='checkbox'
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
					/>
					Personal project
				</label>
			</div>
			{repo.isPersonalProject && (
				<div className='flex flex-wrap items-center gap-2'>
					<form
						className='flex items-center gap-2'
						onSubmit={(e) => {
							e.preventDefault()
							tagsForm.handleSubmit()
						}}
					>
						<tagsForm.Field name='tags'>
							{(field) => (
								<Input
									className='h-8 w-56'
									placeholder='tags, comma separated'
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							)}
						</tagsForm.Field>
						<Button type='submit' size='sm' variant='outline'>
							Save tags
						</Button>
					</form>
					<select
						className='h-8 rounded-md border bg-transparent px-2 text-sm'
						value={repo.status}
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
					>
						<option value='active'>active</option>
						<option value='archived'>archived</option>
					</select>
				</div>
			)}
		</div>
	)
}
