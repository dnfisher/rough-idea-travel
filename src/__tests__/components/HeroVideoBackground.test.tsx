import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HeroVideoBackground } from '@/components/homepage/HeroVideoBackground'

describe('HeroVideoBackground', () => {
  it('renders a video element for each source', () => {
    const { container } = render(<HeroVideoBackground />)
    const videos = container.querySelectorAll('video')
    expect(videos.length).toBe(10)
  })

  it('all video elements are muted and have playsInline', () => {
    const { container } = render(<HeroVideoBackground />)
    const videos = container.querySelectorAll('video')
    videos.forEach(v => {
      expect(v.muted).toBe(true)
      expect(v.hasAttribute('playsinline')).toBe(true)
    })
  })

  it('only one video has autoPlay at a time on initial render', () => {
    const { container } = render(<HeroVideoBackground />)
    const videos = container.querySelectorAll('video')
    const autoPlaying = Array.from(videos).filter(v => v.autoplay)
    expect(autoPlaying.length).toBe(1)
  })

  it('renders the overlay div', () => {
    const { container } = render(<HeroVideoBackground />)
    expect(container.querySelector('.hero-overlay')).toBeTruthy()
  })

  it('non-active videos have preload="none"', () => {
    const { container } = render(<HeroVideoBackground />)
    const videos = container.querySelectorAll('video')
    const nonActive = Array.from(videos).filter(v => !v.autoplay)
    nonActive.forEach(v => {
      expect(v.getAttribute('preload')).toBe('none')
    })
  })
})
