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
      <div className="stage-hero__deco" aria-hidden>
        <img
          className="stage-hero__book"
          src={`${import.meta.env.BASE_URL}hero-book.png`}
          alt=""
        />
      </div>
    </div>
  )
}
