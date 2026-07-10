export default function MusicPage() {
  return (
    <div className='space-y-4'>
      <p className='text-muted-foreground text-center italic'>
        "Sound colors the world before thought arrives."
      </p>
      <div className='flex justify-center'>
        <a
          href='https://music.apple.com/profile/fdarian'
          target='_blank'
          rel='noopener noreferrer'
          className='border-b border-border hover:border-foreground transition-colors ease-out duration-100 text-sm'
        >
          Apple Music
        </a>
      </div>
    </div>
  )
}
