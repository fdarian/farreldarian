import { listProjects } from '@/lib/panel'

// Backed by a live panel API — can't be known at build time.
export const dynamic = 'force-dynamic'

export default async function SoftwarePage() {
	const projects = await listProjects()

	return (
		<section className='space-y-4'>
			<h1 className='font-serif text-lg font-medium'>Software</h1>

			<ul className='space-y-2'>
				{projects.map((project) => (
					<li key={project.href}>
						<a
							href={project.href}
							target='_blank'
							rel='noopener noreferrer'
							className='border-b border-border hover:border-foreground transition-colors ease-out duration-100'
						>
							{project.name}
						</a>
						<p className='text-sm text-muted-foreground'>
							{project.description}
						</p>
					</li>
				))}
			</ul>
		</section>
	)
}
