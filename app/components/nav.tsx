import { cn } from 'utils/class'

export function Nav({
  children,
  className,
  ...rest
}: React.ComponentProps<'nav'>) {
  return (
    <nav
      className={cn(
        'text-sm text-muted-foreground hover:text-foreground cursor-pointer',
        className
      )}
      {...rest}
    >
      {children}
    </nav>
  )
}
