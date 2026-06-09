function HeroBookArt() {
  return (
    <svg
      className="stage-hero__book"
      viewBox="0 0 140 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Open book — left page */}
      <path
        d="M70 18c-18 0-36 8-48 14v58c0 4 3 6 7 5l41-10V18z"
        fill="rgba(255,255,255,0.14)"
        stroke="rgba(255,255,255,0.38)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Right page */}
      <path
        d="M70 18c18 0 36 8 48 14v58c0 4-3 6-7 5l-41-10V18z"
        fill="rgba(255,255,255,0.1)"
        stroke="rgba(255,255,255,0.38)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Spine curve */}
      <path
        d="M70 18v62"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Page lines — left */}
      <path d="M32 38h28M30 46h26M28 54h24M27 62h22" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Page lines — right */}
      <path d="M82 38h28M84 46h26M86 54h24M87 62h22" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Bookmark ribbon */}
      <path
        d="M70 22v28l-5-4-5 4V22h10z"
        fill="rgba(255,220,100,0.55)"
        stroke="rgba(255,220,100,0.7)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Sparkles */}
      <path
        d="M58 12l1.2 3.6h3.8l-3.1 2.3 1.2 3.6L58 19.2l-3.1 2.3 1.2-3.6-3.1-2.3h3.8L58 12z"
        fill="rgba(255,230,140,0.75)"
      />
      <path
        d="M88 8l0.8 2.4h2.5l-2 1.5 0.8 2.4L88 13.3l-2 1.5 0.8-2.4-2-1.5h2.5L88 8z"
        fill="rgba(255,230,140,0.55)"
      />
      <path
        d="M102 20l0.6 1.8h1.9l-1.5 1.1 0.6 1.8L102 23.7l-1.5 1.1 0.6-1.8-1.5-1.1h1.9L102 20z"
        fill="rgba(255,230,140,0.4)"
      />
    </svg>
  )
}

interface StageHeroProps {
  title: string
  slideIndex: number
  slideCount: number
  text: string
}

function countWords(text: string) {
  const t = text.trim()
  if (!t) return 0
  return t.split(/\s+/).length
}

export function StageHero({ title, slideIndex, slideCount, text }: StageHeroProps) {
  const words = countWords(text)
  const displayTitle = title.trim() || 'Your passage'

  return (
    <div className="stage-hero">
      <div className="stage-hero__content">
        <h2 className="stage-hero__title">{displayTitle}</h2>
        <p className="stage-hero__subtitle">Highlight, annotate, and present for your class</p>
        <div className="stage-hero__pills">
          <span className="pill">
            Passage {slideIndex + 1} of {slideCount}
          </span>
          {words > 0 && <span className="pill">{words} words</span>}
        </div>
      </div>
      <div className="stage-hero__deco">
        <HeroBookArt />
      </div>
    </div>
  )
}
