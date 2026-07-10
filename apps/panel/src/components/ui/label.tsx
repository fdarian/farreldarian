import type * as React from 'react'
import { cn } from '#/lib/utils.ts'

function Label({ className, ...props }: React.ComponentProps<'label'>) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: generic primitive — htmlFor/children are the caller's responsibility
		<label
			data-slot='label'
			className={cn(
				'flex select-none items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
				className
			)}
			{...props}
		/>
	)
}

export { Label }
