import { useRef } from 'react'
import type { ImageBlock } from '../types'

interface ImageContainerProps {
  images: ImageBlock[]
  onAdd: (src: string) => void
  onRemove: (id: string) => void
  onCaptionChange: (id: string, caption: string) => void
  onWidthChange: (id: string, width: number) => void
}

function ImageCard({
  img,
  onRemove,
  onCaptionChange,
  onWidthChange,
}: {
  img: ImageBlock
  onRemove: (id: string) => void
  onCaptionChange: (id: string, caption: string) => void
  onWidthChange: (id: string, width: number) => void
}) {
  const cardRef = useRef<HTMLElement>(null)
  const resize = useRef<{ startX: number; startWidth: number } | null>(null)

  const maxWidth = () => cardRef.current?.parentElement?.clientWidth ?? 800

  const onResizeDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const el = cardRef.current
    if (!el) return
    resize.current = {
      startX: e.clientX,
      startWidth: img.width ?? el.offsetWidth,
    }
    el.setPointerCapture(e.pointerId)
  }

  const onResizeMove = (e: React.PointerEvent) => {
    if (!resize.current) return
    const delta = e.clientX - resize.current.startX
    const next = Math.round(
      Math.max(160, Math.min(maxWidth(), resize.current.startWidth + delta)),
    )
    onWidthChange(img.id, next)
  }

  const onResizeUp = (e: React.PointerEvent) => {
    if (!resize.current) return
    resize.current = null
    cardRef.current?.releasePointerCapture(e.pointerId)
  }

  return (
    <figure
      ref={cardRef}
      className={`image-card${img.width ? ' image-card--sized' : ''}`}
      style={img.width ? { width: img.width } : undefined}
    >
      <div className="image-card__frame">
        <button
          type="button"
          className="image-card__remove"
          onClick={() => onRemove(img.id)}
          aria-label="Remove image"
        >
          ×
        </button>
        <img src={img.src} alt={img.caption || 'Presentation image'} draggable={false} />
        <div
          className="image-card__resize"
          onPointerDown={onResizeDown}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeUp}
          onPointerCancel={onResizeUp}
          aria-label="Drag to resize"
          title="Drag to enlarge"
        />
      </div>
      <figcaption>
        <input
          type="text"
          value={img.caption}
          placeholder="Caption (optional)"
          onChange={(e) => onCaptionChange(img.id, e.target.value)}
        />
      </figcaption>
    </figure>
  )
}

export function ImageContainer({
  images,
  onAdd,
  onRemove,
  onCaptionChange,
  onWidthChange,
}: ImageContainerProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onAdd(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) handleFile(file)
        e.preventDefault()
        return
      }
    }
  }

  return (
    <div className="image-container" onPaste={handlePaste}>
      {images.length === 0 ? (
        <button
          type="button"
          className="image-dropzone"
          onClick={() => fileRef.current?.click()}
        >
          <span className="image-dropzone__icon">+</span>
          <span>Add image — click, paste, or drop</span>
        </button>
      ) : (
        <div className="image-grid">
          {images.map((img) => (
            <ImageCard
              key={img.id}
              img={img}
              onRemove={onRemove}
              onCaptionChange={onCaptionChange}
              onWidthChange={onWidthChange}
            />
          ))}
          <button
            type="button"
            className="image-add-more"
            onClick={() => fileRef.current?.click()}
          >
            +
          </button>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
