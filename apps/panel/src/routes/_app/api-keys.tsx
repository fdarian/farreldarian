import { useForm } from '@tanstack/react-form'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import * as S from 'effect/Schema'
import { useState } from 'react'
import { Button } from '#/components/ui/button.tsx'
import {
	Dialog,
	DialogClose,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogPopup,
	DialogTitle,
	DialogTrigger,
} from '#/components/ui/dialog.tsx'
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

const CreateKeySchema = S.Struct({ name: S.String.check(S.isMinLength(1)) })

/** Standard Schema issues are `{ message: string, ... }`, but TanStack Form types field errors as `unknown`. */
function fieldErrorMessage(error: unknown): string {
	if (typeof error === 'string') return error
	if (
		error !== null &&
		typeof error === 'object' &&
		'message' in error &&
		typeof error.message === 'string'
	) {
		return error.message
	}
	return 'Invalid value'
}

function ApiKeysPage() {
	const { apiKeys: keys } = Route.useLoaderData()
	const router = useRouter()
	const [createdKey, setCreatedKey] = useState<string | null>(null)
	const [dialogOpen, setDialogOpen] = useState(false)

	const form = useForm({
		defaultValues: { name: '' },
		validators: { onChange: S.toStandardSchemaV1(CreateKeySchema) },
		onSubmit: async ({ value, formApi }) => {
			const created = await createApiKey({ data: { name: value.name } })
			setCreatedKey(created.key)
			formApi.reset()
			setDialogOpen(false)
			router.invalidate()
		},
	})

	return (
		<div className='mx-auto max-w-2xl space-y-6 p-6'>
			<div className='flex items-start justify-between gap-4'>
				<div>
					<h1 className='font-semibold text-xl'>API keys</h1>
					<p className='text-muted-foreground text-sm'>
						Keys authenticate <code>apps/web</code> against the panel's API v1.
					</p>
				</div>
				<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
					<DialogTrigger render={<Button />}>New key</DialogTrigger>
					<DialogPopup className='sm:max-w-sm'>
						<DialogHeader>
							<DialogTitle>New key</DialogTitle>
							<DialogDescription>
								The full key is shown once, right after creation.
							</DialogDescription>
						</DialogHeader>
						<form
							onSubmit={(e) => {
								e.preventDefault()
								form.handleSubmit()
							}}
						>
							<DialogPanel>
								<form.Field name='name'>
									{(field) => (
										<div className='space-y-2'>
											<Label htmlFor={field.name}>Name</Label>
											<Input
												id={field.name}
												placeholder='web'
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
											{field.state.meta.errors.map((error, index) => (
												<p
													// biome-ignore lint/suspicious/noArrayIndexKey: errors have no stable identity
													key={index}
													className='text-destructive text-sm'
												>
													{fieldErrorMessage(error)}
												</p>
											))}
										</div>
									)}
								</form.Field>
							</DialogPanel>
							<DialogFooter variant='bare'>
								<DialogClose render={<Button type='button' variant='ghost' />}>
									Cancel
								</DialogClose>
								<Button type='submit'>Create</Button>
							</DialogFooter>
						</form>
					</DialogPopup>
				</Dialog>
			</div>

			{createdKey && (
				<div className='rounded-md border border-primary/30 bg-primary/5 p-3 font-mono text-sm break-all'>
					{createdKey}
				</div>
			)}

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
