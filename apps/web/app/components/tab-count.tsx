import type { ReactNode } from 'react'

/** The small chip a tab label uses to show a count — shared so tab lists can't drift in styling. */
export function TabCount(props: { children: ReactNode }) {
	return (
		<span className='rounded-full border-[0.5px] border-border bg-muted px-1 py-0.5 text-[10px] text-muted-foreground leading-[10px] group-data-active:text-foreground'>
			{props.children}{' '}
		</span>
	)
}
