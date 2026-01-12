import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import ArrowUpRight from './ArrowUpRight'

export default function IndexPage() {
  return (
    <main className='min-h-screen grid place-content-center py-28 p-6'>
      <div className='md:max-w-3xl md:mx-auto space-y-12 overflow-hidden'>
        <section className='text-2xl space-y-6 font-medium'>
          <p>Farrel Darian</p>
          <p>
            Innovating as an experienced full-stack engineer, specializing in
            blockchain and web technology, educated in computer science and AI.
          </p>
          <p>
            Currently building{' '}
            <Link href='https://netra.live' external>
              Netra
            </Link>{' '}
            as CTO. Previously at{' '}
            <Link href='https://www.gdplabs.id/' external>
              GDP Labs
            </Link>
            .
          </p>
          <p>Based in Jakarta with global mindset.</p>
        </section>

        <section className='flex gap-6 text-lg flex-wrap'>
          <Link href='mailto:contact@farreldarian.com' external>
            Say hello
          </Link>
          <Link href='https://www.linkedin.com/in/farreldarian/' external>
            linked in
          </Link>
          <Link href='https://twitter.com/farreldarian' external>
            twitter
          </Link>
          <Link href='https://github.com/farreldarian' external>
            github
          </Link>
        </section>

        <Section title='Talks' className='flex gap-6 overflow-x-auto'>
          <TalksCard
            event='AsiaBerlin'
            title='Building the future with Music & Healthcare - the Indonesia way'
            type='Panel'
            place='Berlin'
            year='2022'
            href='https://www.youtube.com/watch?t=19891&v=B4GdwBBQUQs&feature=youtu.be'
          />
          <TalksCard
            event='Beyond B'
            type='Seminar'
            title='Smart Contract Programming with Solidity'
            place='Virtual'
            year='2021'
            href='https://www.kaskus.co.id/thread/610ba83e5263da119c5945c3/gagal-paham-dengan-crypto-join-webinar-beyond-b--how-crypto-works-under-the-hood/'
          />
        </Section>

        <Section title='Music' className='flex items-center gap-6'>
          <Link href='https://soundcloud.com/dearen' external>
            Soundcloud
          </Link>
          <Link href='https://music.apple.com/profile/farreldarian' external>
            Apple Music
          </Link>
        </Section>
      </div>
    </main>
  )
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  external?: boolean
}

function Link({ children, external, ...rest }: LinkProps) {
  return (
    <a
      className='border-b border-zinc-300 hover:border-zinc-950 transition-colors ease-out duration-100'
      {...(external && {
        target: '_blank',
        rel: 'noopener noreferrer',
      })}
      {...rest}
    >
      {children}
    </a>
  )
}

function Section({
  title,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { title: string; children: ReactNode }) {
  return (
    <section className='space-y-4'>
      <h2 className='font-medium'>{title}</h2>
      <div {...rest}>{children}</div>
    </section>
  )
}

function TalksCard(props: {
  href: string
  event: string
  type: string
  title: string
  place: string
  year: string
}) {
  return (
    <a
      href={props.href}
      target='_blank'
      rel='noopener noreferrer'
      className='w-96 flex-shrink-0 py-5 px-4 border border-zinc-300 rounded space-y-5 flex flex-col group'
    >
      <span className='flex justify-between text-zinc-400 text-sm group-hover:text-zinc-950 transition-colors'>
        <p>{props.event}</p>
        <ArrowUpRight
          width={18}
          height={18}
          className='group-hover:translate-x-[2px] group-hover:-translate-y-[2px] transition-transform'
        />
      </span>
      <p className='font-medium flex-grow'>
        {props.type}: {props.title}
      </p>
      <p className='text-zinc-400 text-sm group-hover:text-zinc-950 transition-colors'>
        {props.place} · {props.year}
      </p>
    </a>
  )
}
