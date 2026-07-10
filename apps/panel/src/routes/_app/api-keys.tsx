import { useForm } from '@tanstack/react-form'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '#/components/ui/button.tsx'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#/components/ui/card.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import {
	createApiKey,
	listApiKeys,
	revokeApiKey,
} from '#/server/auth/api-keys.functions.ts'

export const Route = createFileRoute('/_app/api-keys')({
	loader: () => listApiKeys(),
	component: ApiKeysPage,
})

function ApiKeysPage() {
	const { apiKeys: keys } = Route.useLoaderData()
	const router = useRouter()
	const [createdKey, setCreatedKey] = useState<string | null>(null)

	const form = useForm({
		defaultValues: { name: '' },
		onSubmit: async ({ value, formApi }) => {
			const created = await createApiKey({ data: { name: value.name } })
			setCreatedKey(created.key)
			formApi.reset()
			router.invalidate()
		},
	})

	return (
		<div className='mx-auto max-w-2xl space-y-6 p-6'>
			<h1 className='font-semibold text-xl'>API keys</h1>
			<p className='text-muted-foreground text-sm'>
				Keys authenticate <code>apps/web</code> against the panel's API v1.
			</p>

			<Card>
				<CardHeader>
					<CardTitle>New key</CardTitle>
					<CardDescription>
						The full key is shown once, right after creation.
					</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					{createdKey && (
						<div className='rounded-md border border-primary/30 bg-primary/5 p-3 font-mono text-sm break-all'>
							{createdKey}
						</div>
					)}
					<form
						className='flex items-end gap-2'
						onSubmit={(e) => {
							e.preventDefault()
							form.handleSubmit()
						}}
					>
						<form.Field name='name'>
							{(field) => (
								<div className='flex-1 space-y-2'>
									<Label htmlFor={field.name}>Name</Label>
									<Input
										id={field.name}
										placeholder='web'
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
								</div>
							)}
						</form.Field>
						<Button type='submit'>Create</Button>
					</form>
				</CardContent>
			</Card>

			<div className='divide-y rounded-lg border'>
				{keys.map((key) => (
					<div
						key={key.id}
						className='flex items-center justify-between gap-4 p-4'
					>
						<div>
							<p className='font-medium text-sm'>{key.name ?? '(unnamed)'}</p>
							<p className='text-muted-foreground text-sm'>
								{key.start}… · created{' '}
								{new Date(key.createdAt).toLocaleDateString()}
							</p>
						</div>
						<Button
							variant='outline'
							size='sm'
							onClick={async () => {
								await revokeApiKey({ data: { keyId: key.id } })
								router.invalidate()
							}}
						>
							Revoke
						</Button>
					</div>
				))}
				{keys.length === 0 && (
					<p className='p-4 text-muted-foreground text-sm'>No API keys yet.</p>
				)}
			</div>
		</div>
	)
}
