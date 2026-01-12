import * as Tabs from '@radix-ui/react-tabs'
import dynamic from 'next/dynamic'
import type { AnchorHTMLAttributes } from 'react'
import { ExpNumber } from './components/exp-client'

export default function IndexPage() {
  return (
    <>
      <section className='space-y-4'>
        <p className='font-serif text-lg font-medium'>
          Farrel Darian, compulsive builder, engineer. / Currently exploring how
          philosophical principles guide the design of intelligent systems.
        </p>

        {/*<p>
          Currently building{' '}
          <Link href='https://netra.live' external>
            Netra
          </Link>{' '}
          as CTO. Previously at{' '}
          <Link href='https://www.gdplabs.id/' external>
            GDP Labs
          </Link>
          .
        </p>*/}
      </section>

      <section className='flex gap-6 text-lg flex-wrap'>
        <Link href='mailto:farrel@fdarian.com' external>
          Mail
        </Link>
        <Link href='https://www.linkedin.com/in/farreldarian/' external>
          LinkedIn
        </Link>
        <Link href='https://twitter.com/farreldarian' external>
          X
        </Link>
        <Link href='https://github.com/fdarian' external>
          Github
        </Link>
      </section>

      <Tabs.Root defaultValue='talks' defaultChecked asChild>
        <section className='space-y-2'>
          <Tabs.List className='flex items-center gap-3'>
            <Tab title='Experience' value='exp' number={<ExpNumber />} />
            <Tab title='Talks' value='talks' number='2' />
          </Tabs.List>

          <Tabs.Content value='talks' className='space-y-4'>
            <Talks
              place='Berlin'
              year='2022'
              event='AsiaBerlin'
              title='Building the future with Music & Healthcare - the Indonesia way'
              link='https://www.youtube.com/watch?t=19891&v=B4GdwBBQUQs&feature=youtu.be'
            />
            <Talks
              place='Virtual'
              year='2021'
              event='Beyond B'
              title='Smart Contract Programming with Solidity'
              link='https://www.kaskus.co.id/thread/610ba83e5263da119c5945c3/gagal-paham-dengan-crypto-join-webinar-beyond-b--how-crypto-works-under-the-hood/'
            />
          </Tabs.Content>

          <Tabs.Content value='exp' className='space-y-4'>
            <Experience
              year='2023 - Present'
              place='Risedle'
              title='On the side, I participated in building market and sentiment intelligence systems'
            />
            <Experience
              year='2024 - 2026'
              place='AturAI'
              title='Born from personal frustration, I initiated a legal knowledge base startup'
            />
            <Experience
              place='Netra'
              year='2022 - 2025'
              title='Drawn into the startup world early, I was the founding engineer building a blockchain-based royalty distribution system along with several other innovations for the music industry'
            />
            <Experience
              place='GDP Labs'
              year='2021 - 2022'
              title='My first contribution to the tech industry as a blockchain engineer and researcher'
            />
            <Experience
              place='Binus University'
              year='2019 - 2021'
              title='While pursuing my degree, I started my career teaching as a lab assistant'
            />
          </Tabs.Content>
        </section>
      </Tabs.Root>

      {/*<Section title='Music' className='flex items-center gap-6'>
        <Link href='https://soundcloud.com/dearen' external>
          Soundcloud
        </Link>
        <Link href='https://music.apple.com/profile/farreldarian' external>
          Apple Music
        </Link>
      </Section>*/}
    </>
  )
}

function Talks(props: {
  place: string
  year: string
  event: string
  title: string
  link: string
}) {
  return (
    <div>
      <div className='flex items-center gap-3 text-sm text-muted-foreground'>
        <p>
          — {props.place}, {props.year}
        </p>
        <p>{props.event}</p>

        <a
          target='_blank'
          rel='noopener noreferrer'
          href={props.link}
          className='border-b border-border hover:border-foreground transition-colors ease-out duration-100 text-xs'
        >
          link
        </a>
      </div>
      <p>{props.title}</p>
    </div>
  )
}

function Experience(props: { place: string; year?: string; title: string }) {
  return (
    <div>
      <div className='flex items-center gap-3 text-sm text-muted-foreground'>
        <p>— {props.place}</p>
        <p>{props.year}</p>
      </div>
      <p className='font-medium'>{props.title}</p>
    </div>
  )
}

function Tab(props: { value: string; title: string; number: React.ReactNode }) {
  return (
    <Tabs.Trigger value={props.value} asChild>
      <h2 className='text-sm data-[state=inactive]:text-muted-foreground cursor-pointer flex items-center gap-1.5'>
        <span>{props.title}</span>
        <span className='text-[10px] text-muted-foreground rounded-full bg-neutral-800 border-[0.5px] border-neutral-700 leading-[10px] px-1 py-0.5'>
          {props.number}{' '}
        </span>
      </h2>
    </Tabs.Trigger>
  )
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  external?: boolean
}

function Link({ children, external, ...rest }: LinkProps) {
  return (
    <a
      className='border-b border-border hover:border-foreground transition-colors ease-out duration-100 text-sm'
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
