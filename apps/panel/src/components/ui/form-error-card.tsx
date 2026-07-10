type Props = {
	message: string
	className?: string
}

export function FormErrorCard(props: Props) {
	return (
		<div
			role='alert'
			className={`rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-sm ${props.className ?? ''}`}
		>
			{props.message}
		</div>
	)
}

export function toSubmitErrorMessage(error: unknown): string | null {
	if (error == null) return null
	if (error instanceof Error) return error.message
	if (typeof error === 'string') return error
	return String(error)
}
