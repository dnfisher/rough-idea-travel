'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// TODO: compress videos before production — current files are 6–18MB each
// Target: under 3MB per clip using:
//   ffmpeg -i input.mp4 -vcodec libx264 -crf 28 -preset slow -vf "scale=1920:-2" -movflags +faststart -an output_compressed.mp4
// WebM (30-40% smaller):
//   ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 33 -b:v 0 -vf "scale=1920:-2" -an output.webm
const VIDEO_SOURCES = [
  '/videos/coverr-coast-in-brazil-4147-1080p.mp4',
  '/videos/coverr-grand-teton-national-park-5555-1080p.mp4',
  '/videos/coverr-sandy-beach-3010-1080p.mp4',
  '/videos/coverr-skiing-in-a-winter-wonderland-3258-1080p.mp4',
  '/videos/coverr-sun-rays-coming-through-the-branches-1767-1080p.mp4',
  '/videos/coverr-sunflower-field-571-1080p.mp4',
  '/videos/coverr-sunrise-on-sayulita-beach-in-mexico-7133-1080p.mp4',
  '/videos/coverr-sunrise-on-street-in-mexico-city-2715-1080p.mp4',
  '/videos/coverr-world-trade-center-6092-1080p.mp4',
];

export function HeroVideoBackground() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fadingIndex, setFadingIndex] = useState<number | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const advance = useCallback(() => {
    setActiveIndex(prev => {
      const next = (prev + 1) % VIDEO_SOURCES.length;
      setFadingIndex(prev);
      setTimeout(() => setFadingIndex(null), 1200);
      return next;
    });
  }, []);

  // Preload the next video whenever active changes
  useEffect(() => {
    const nextIndex = (activeIndex + 1) % VIDEO_SOURCES.length;
    const nextVideo = videoRefs.current[nextIndex];
    if (nextVideo && nextVideo.getAttribute('preload') === 'none') {
      nextVideo.load();
    }
  }, [activeIndex]);

  // Imperatively play active video (handles browser autoplay policy gracefully)
  useEffect(() => {
    const active = videoRefs.current[activeIndex];
    if (active) {
      const result = active.play();
      // play() returns a Promise in modern browsers; jsdom returns undefined
      if (result !== undefined) {
        result.catch(() => {
          // Autoplay blocked — advance silently
          advance();
        });
      }
    }
  }, [activeIndex, advance]);

  return (
    <div className="hero-video-container">
      {VIDEO_SOURCES.map((src, index) => (
        <video
          key={src}
          ref={el => { videoRefs.current[index] = el; }}
          src={src}
          autoPlay={index === activeIndex}
          muted
          playsInline
          preload={index === activeIndex ? 'auto' : 'none'}
          poster="/images/hero-poster.jpg"
          onEnded={index === activeIndex ? advance : undefined}
          onError={index === activeIndex ? advance : undefined}
          className={[
            'hero-video',
            index === activeIndex ? 'hero-video--active' :
            index === fadingIndex ? 'hero-video--fading' :
            'hero-video--hidden',
          ].join(' ')}
        />
      ))}
      <div className="hero-overlay" />
    </div>
  );
}
