import type { SVGProps } from 'react'

export default function ArrowUpRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    >
      <title>External link</title>
      <line x1='7' y1='17' x2='17' y2='7' />
      <polyline points='7 7 17 7 17 17' />
    </svg>
  )
}
