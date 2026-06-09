import type { DocumentState } from '../types'
import { createDefaultState } from '../types'

const FILE_VERSION = 1
const FILE_APP = 'reader'

interface FilePickerWindow extends Window {
  showSaveFilePicker?: (options: {
    suggestedName?: string
    types?: { description: string; accept: Record<string, string[]> }[]
  }) => Promise<FileSystemFileHandle>
  showOpenFilePicker?: (options: {
    multiple?: boolean
    types?: { description: string; accept: Record<string, string[]> }[]
  }) => Promise<FileSystemFileHandle[]>
}

const pickerWindow = window as FilePickerWindow

export interface ReaderDocumentFile {
  version: number
  app: string
  savedAt: number
  name: string
  data: Omit<DocumentState, 'presentationMode' | 'frozen' | 'laserPointer' | 'penTool' | 'magnifier'>
}

const FILE_TYPES = [
  {
    description: 'Reader lesson',
    accept: { 'application/json': ['.reader.json', '.json'] },
  },
]

function canSaveWithPicker(): boolean {
  return typeof pickerWindow.showSaveFilePicker === 'function'
}

function canOpenWithPicker(): boolean {
  return typeof pickerWindow.showOpenFilePicker === 'function'
}

function persistableState(state: DocumentState): ReaderDocumentFile['data'] {
  const { presentationMode, frozen, laserPointer, penTool, magnifier, ...data } = state
  return data
}

function suggestedFilename(title: string): string {
  const slug =
    title
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 48) || 'reader-lesson'
  return `${slug}.reader.json`
}

export function buildDocumentFile(state: DocumentState, name?: string): ReaderDocumentFile {
  const slide = state.slides.find((s) => s.id === state.activeSlideId) ?? state.slides[0]
  return {
    version: FILE_VERSION,
    app: FILE_APP,
    savedAt: Date.now(),
    name: name?.trim() || slide?.title || 'Reader lesson',
    data: persistableState(state),
  }
}

export function parseDocumentFile(raw: string): DocumentState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<ReaderDocumentFile>
    if (parsed.app !== FILE_APP || !parsed.data || !Array.isArray(parsed.data.slides)) {
      return null
    }
    return {
      ...createDefaultState(),
      ...parsed.data,
      presentationMode: false,
      frozen: false,
      laserPointer: false,
      penTool: false,
      magnifier: false,
    }
  } catch {
    return null
  }
}

async function writeBlobWithPicker(blob: Blob, suggestedName: string): Promise<'saved' | 'cancelled'> {
  if (canSaveWithPicker()) {
    try {
      const handle = await pickerWindow.showSaveFilePicker!({
        suggestedName,
        types: FILE_TYPES,
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return 'saved'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
      throw err
    }
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = suggestedName
  link.click()
  URL.revokeObjectURL(url)
  return 'saved'
}

export async function saveDocumentFile(
  state: DocumentState,
  name?: string,
): Promise<'saved' | 'cancelled'> {
  const file = buildDocumentFile(state, name)
  const json = JSON.stringify(file, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  return writeBlobWithPicker(blob, suggestedFilename(file.name))
}

async function readFileWithPicker(): Promise<File | null> {
  if (canOpenWithPicker()) {
    try {
      const [handle] = await pickerWindow.showOpenFilePicker!({
        multiple: false,
        types: FILE_TYPES,
      })
      return handle.getFile()
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return null
      throw err
    }
  }

  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.reader.json,.json,application/json'
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.oncancel = () => resolve(null)
    input.click()
  })
}

export async function openDocumentFile(): Promise<DocumentState | null> {
  const file = await readFileWithPicker()
  if (!file) return null
  const text = await file.text()
  return parseDocumentFile(text)
}
