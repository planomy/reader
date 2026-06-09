import { useCallback, useRef, useState } from 'react'
import { ImageContainer } from './components/ImageContainer'
import {
  FreezeOverlay,
  LaserPointer,
  Magnifier,
  Spotlight,
  useTimer,
  VocabPanel,
} from './components/overlays'
import { SlideTabs, SplitPane } from './components/SlideUI'
import { PenLayer } from './components/PenLayer'
import { PresentationBar } from './components/PresentationBar'
import { StickyNotesLayer } from './components/StickyNotes'
import { TextCanvas } from './components/TextCanvas'
import { Toolbox } from './components/Toolbox'
import { WordPopup } from './components/WordPopup'
import { useDocument } from './hooks/useDocument'
import type { FontFamily, HighlightColor, WordAnnotation } from './types'
import { getActiveSlide } from './types'
import { captureStage, exportStagePdf, exportStagePng } from './utils/export'
import { uid } from './utils/text'

const FONT_CLASSES: Record<FontFamily, string> = {
  fredoka: 'font-fredoka',
  nunito: 'font-nunito',
  caveat: 'font-caveat',
  patrick: 'font-patrick',
  space: 'font-space',
}

interface PopupState {
  start: number
  end: number
  word: string
  x: number
  y: number
  side: 'primary' | 'compare'
}

export default function App() {
  const { state, dispatch, addHighlight, setAnnotation, undo, copyText, canUndo } = useDocument()
  const timer = useTimer()
  const stageRef = useRef<HTMLDivElement>(null)
  const [freezeImage, setFreezeImage] = useState<string | null>(null)
  const [penClear, setPenClear] = useState(0)

  const slide = getActiveSlide(state)
  const [activeColor, setActiveColor] = useState<HighlightColor>('yellow')
  const [popup, setPopup] = useState<PopupState | null>(null)
  const [showVocab, setShowVocab] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showImages, setShowImages] = useState(slide.images.length > 0)

  const activeSide = state.compareMode && state.compareSide === 'compare' ? 'compare' : 'primary'
  const annotations = activeSide === 'compare' ? slide.compareAnnotations : slide.annotations
  const existingNote =
    popup &&
    annotations.find((a) => a.start === popup.start && a.end === popup.end)?.note

  const handleHighlight = useCallback(
    (start: number, end: number, side: 'primary' | 'compare' = activeSide) => {
      if (state.revealMode || state.penTool) return
      addHighlight(start, end, activeColor, side)
    },
    [addHighlight, activeColor, state.revealMode, state.penTool, activeSide],
  )

  const handleWordDoubleClick = useCallback(
    (start: number, end: number, word: string, x: number, y: number, side: 'primary' | 'compare' = activeSide) => {
      if (state.penTool) return
      setPopup({ start, end, word, x, y, side })
    },
    [state.penTool, activeSide],
  )

  const handleSavePopup = (note: string) => {
    if (!popup) return
    if (note.trim()) {
      setAnnotation(popup.start, popup.end, popup.word, note.trim(), popup.side)
    } else {
      const list = popup.side === 'compare' ? slide.compareAnnotations : slide.annotations
      const existing = list.find((a) => a.start === popup.start && a.end === popup.end)
      if (existing) dispatch({ type: 'REMOVE_ANNOTATION', id: existing.id, side: popup.side })
    }
    setPopup(null)
  }

  const handleCopy = async () => {
    await copyText()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportPng = async () => {
    if (stageRef.current) await exportStagePng(stageRef.current, slide.title || 'reader')
  }

  const handleExportPdf = async () => {
    if (stageRef.current) await exportStagePdf(stageRef.current, slide.title || 'reader')
  }

  const handleFreeze = async () => {
    if (state.frozen) {
      setFreezeImage(null)
      dispatch({ type: 'TOGGLE_FROZEN' })
      return
    }
    if (stageRef.current) {
      const img = await captureStage(stageRef.current)
      setFreezeImage(img)
      dispatch({ type: 'TOGGLE_FROZEN' })
    }
  }

  const handleClearPen = () => setPenClear((n) => n + 1)

  const handleAddSticky = () => {
    dispatch({
      type: 'ADD_STICKY',
      note: {
        id: uid(),
        slideId: slide.id,
        x: 10 + Math.random() * 20,
        y: 10 + Math.random() * 15,
        text: '',
      },
    })
  }

  const textPanel = (
    <div className="text-area-wrap">
      <div className={`text-panels ${state.compareMode ? 'text-panels--compare' : ''}`}>
        <TextCanvas
          text={slide.text}
          highlights={slide.highlights}
          annotations={slide.annotations}
          fontSize={state.fontSize}
          lineHeight={state.lineHeight}
          fontClass={FONT_CLASSES[state.font]}
          revealMode={state.revealMode && activeSide === 'primary'}
          revealedSentences={state.revealedSentences}
          focusLine={state.focusLine}
          showLineNumbers={state.showLineNumbers}
          answersHidden={state.answersHidden}
          label={state.compareMode ? 'Original' : undefined}
          disabled={state.penTool}
          onHighlight={(s, e) => handleHighlight(s, e, 'primary')}
          onWordDoubleClick={(s, e, w, x, y) => handleWordDoubleClick(s, e, w, x, y, 'primary')}
          onRevealNext={() => dispatch({ type: 'REVEAL_NEXT' })}
        />
        {state.compareMode && (
          <TextCanvas
            text={slide.compareText}
            highlights={slide.compareHighlights}
            annotations={slide.compareAnnotations}
            fontSize={state.fontSize}
            lineHeight={state.lineHeight}
            fontClass={FONT_CLASSES[state.font]}
            revealMode={false}
            revealedSentences={0}
            focusLine={false}
            showLineNumbers={state.showLineNumbers}
            answersHidden={state.answersHidden}
            label="Compare"
            disabled={state.penTool}
            onHighlight={(s, e) => handleHighlight(s, e, 'compare')}
            onWordDoubleClick={(s, e, w, x, y) => handleWordDoubleClick(s, e, w, x, y, 'compare')}
            onRevealNext={() => {}}
          />
        )}
      </div>
    </div>
  )

  const mediaPanel = (
    <>
      {(showImages || slide.images.length > 0) && (
        <ImageContainer
          images={slide.images}
          onAdd={(src) => {
            dispatch({ type: 'ADD_IMAGE', image: { id: uid(), src, caption: '' } })
            setShowImages(true)
          }}
          onRemove={(id) => dispatch({ type: 'REMOVE_IMAGE', id })}
          onCaptionChange={(id, caption) =>
            dispatch({ type: 'UPDATE_IMAGE_CAPTION', id, caption })
          }
          onWidthChange={(id, width) =>
            dispatch({ type: 'UPDATE_IMAGE_WIDTH', id, width })
          }
        />
      )}
      {showVocab && !state.presentationMode && (
        <div className="vocab-drawer">
          <h3>Vocabulary</h3>
          <VocabPanel
            annotations={[...slide.annotations, ...slide.compareAnnotations]}
            onSelect={(a: WordAnnotation) =>
              setPopup({
                start: a.start,
                end: a.end,
                word: a.word,
                x: window.innerWidth / 2,
                y: window.innerHeight / 3,
                side: slide.annotations.some((x) => x.id === a.id) ? 'primary' : 'compare',
              })
            }
          />
        </div>
      )}
    </>
  )

  return (
    <div className={`app ${state.presentationMode ? 'app--presentation' : ''}`}>
      {!state.presentationMode && (
        <Toolbox
          state={state}
          dispatch={dispatch}
          activeColor={activeColor}
          onColorChange={setActiveColor}
          onPasteText={(text, side) => dispatch({ type: 'SET_TEXT', text, side })}
          onCopy={handleCopy}
          onUndo={undo}
          canUndo={canUndo}
          onAddImage={() => setShowImages(true)}
          onAddSticky={handleAddSticky}
          onClearPen={handleClearPen}
          onExportPng={handleExportPng}
          onExportPdf={handleExportPdf}
          onFreeze={handleFreeze}
          onLoadLesson={(loaded) => dispatch({ type: 'LOAD_STATE', state: loaded })}
          showVocab={showVocab}
          onToggleVocab={() => setShowVocab((v) => !v)}
          timer={timer}
          copied={copied}
        />
      )}

      <main className="stage">
        {state.presentationMode && (
          <>
            <button type="button" className="exit-presentation" onClick={() => dispatch({ type: 'TOGGLE_PRESENTATION' })}>
              Exit clean view
            </button>
            <PresentationBar state={state} dispatch={dispatch} onClearPen={handleClearPen} />
          </>
        )}

        {!state.presentationMode && (
          <SlideTabs
            slides={state.slides.map((s) => ({ id: s.id, title: s.title }))}
            activeId={state.activeSlideId}
            onSelect={(id) => dispatch({ type: 'SET_ACTIVE_SLIDE', id })}
            onAdd={() => dispatch({ type: 'ADD_SLIDE' })}
            onRemove={(id) => dispatch({ type: 'REMOVE_SLIDE', id })}
            onRename={(id, title) => dispatch({ type: 'RENAME_SLIDE', id, title })}
          />
        )}

        <div ref={stageRef} className="stage__capture">
          <SplitPane
            enabled={state.splitLayout && !state.compareMode}
            ratio={state.splitRatio}
            onRatioChange={(ratio) => dispatch({ type: 'SET_SPLIT_RATIO', ratio })}
            left={textPanel}
            right={mediaPanel}
          />

          <StickyNotesLayer
            notes={state.stickyNotes}
            slideId={slide.id}
            onUpdate={(id, patch) => dispatch({ type: 'UPDATE_STICKY', id, ...patch })}
            onRemove={(id) => dispatch({ type: 'REMOVE_STICKY', id })}
          />

        </div>
      </main>

      <Spotlight active={state.spotlight} />
      <LaserPointer active={state.laserPointer} />
      <Magnifier active={state.magnifier} targetRef={stageRef} />

      <PenLayer active={state.penTool} clearSignal={penClear} targetRef={stageRef} />

      {state.frozen && freezeImage && (
        <FreezeOverlay
          image={freezeImage}
          onUnfreeze={() => {
            setFreezeImage(null)
            dispatch({ type: 'TOGGLE_FROZEN' })
          }}
        />
      )}

      {popup && (
        <WordPopup
          word={popup.word}
          note={existingNote ?? ''}
          x={popup.x}
          y={popup.y}
          onSave={handleSavePopup}
          onClose={() => setPopup(null)}
          onDelete={() => {
            const list = popup.side === 'compare' ? slide.compareAnnotations : slide.annotations
            const existing = list.find((a) => a.start === popup.start && a.end === popup.end)
            if (existing) dispatch({ type: 'REMOVE_ANNOTATION', id: existing.id, side: popup.side })
            setPopup(null)
          }}
        />
      )}
    </div>
  )
}
