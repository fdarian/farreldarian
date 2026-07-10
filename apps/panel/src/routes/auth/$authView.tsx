import { useForm } from '@tanstack/react-form'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import * as S from 'effect/Schema'
import { useState } from 'react'
import { authClient } from '#/client/auth.ts'
import { Button } from '#/components/ui/button.tsx'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#/components/ui/card.tsx'
import {
	FormErrorCard,
	toSubmitErrorMessage,
} from '#/components/ui/form-error-card.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { ALLOWED_EMAIL } from '#/server/auth/allowlist.ts'
import { getEnabledAuthProviders } from '#/server/auth/providers.functions.ts'
import { DevEmailInput } from '#/server/auth/schemas.ts'
import { getUserSession } from '#/server/auth/session.functions.ts'

function sanitizeRedirectTarget(value: unknown): string {
	if (typeof value !== 'string') return '/'
	if (!value.startsWith('/') || value.startsWith('//')) return '/'
	return value
}

export const Route = createFileRoute('/auth/$authView')({
	validateSearch: (search: Record<string, unknown>) => {
		const out: { redirect?: string } = {}
		if (typeof search.redirect === 'string') {
			out.redirect = sanitizeRedirectTarget(search.redirect)
		}
		return out
	},
	beforeLoad: async ({ search }) => {
		const session = await getUserSession()
		if (session != null) {
			throw redirect({ href: sanitizeRedirectTarget(search.redirect) })
		}
	},
	loader: async () => ({ providers: await getEnabledAuthProviders() }),
	component: AuthPage,
})

function GoogleSignInButton(props: { redirectTarget: string }) {
	const [isLoading, setIsLoading] = useState(false)

	const handleSignIn = async () => {
		setIsLoading(true)
		try {
			await authClient.signIn.social({
				provider: 'google',
				callbackURL: props.redirectTarget,
			})
		} catch {
			setIsLoading(false)
		}
	}

	return (
		<Button
			variant='outline'
			className='w-full'
			onClick={handleSignIn}
			disabled={isLoading}
		>
			{isLoading ? 'Signing in...' : 'Continue with Google'}
		</Button>
	)
}

function DevEmailForm(props: { redirectTarget: string }) {
	const navigate = useNavigate()

	const form = useForm({
		defaultValues: { email: ALLOWED_EMAIL },
		validators: {
			onChange: S.toStandardSchemaV1(DevEmailInput),
			onSubmit: (): string | undefined => undefined,
		},
		onSubmit: async (params) => {
			try {
				const response = await fetch('/api/auth/sign-in/email-only', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email: params.value.email }),
				})
				if (!response.ok) {
					const data = (await response.json()) as { message?: string }
					params.formApi.setErrorMap({
						onSubmit:
							data.message ?? 'Sign in failed. Please check your email.',
					})
					return
				}
				navigate({ href: props.redirectTarget })
			} catch (error) {
				const message = toSubmitErrorMessage(error) ?? 'Sign in failed.'
				params.formApi.setErrorMap({ onSubmit: message })
			}
		},
	})

	const submitForm = () => {
		form.setErrorMap({ onSubmit: undefined })
		form.handleSubmit()
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				submitForm()
			}}
			className='space-y-4'
		>
			<form.Field name='email'>
				{(field) => (
					<div className='space-y-2'>
						<Label htmlFor={field.name}>Email</Label>
						<Input
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
					</div>
				)}
			</form.Field>
			<form.Subscribe selector={(state) => state.errorMap.onSubmit}>
				{(error) => (error ? <FormErrorCard message={String(error)} /> : null)}
			</form.Subscribe>
			<Button type='submit' className='w-full'>
				Sign in
			</Button>
		</form>
	)
}

function AuthPage() {
	const { providers } = Route.useLoaderData()
	const { redirect: redirectSearch } = Route.useSearch()
	const redirectTarget = sanitizeRedirectTarget(redirectSearch)

	return (
		<div className='flex min-h-screen items-center justify-center p-4'>
			<Card className='w-full max-w-sm'>
				<CardHeader>
					<CardTitle>Sign in</CardTitle>
					<CardDescription>
						farreldarian's panel — restricted access.
					</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					{providers.google && (
						<GoogleSignInButton redirectTarget={redirectTarget} />
					)}
					{import.meta.env.DEV && (
						<DevEmailForm redirectTarget={redirectTarget} />
					)}
				</CardContent>
			</Card>
		</div>
	)
}
