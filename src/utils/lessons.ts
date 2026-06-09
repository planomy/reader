import type { DocumentState, SavedLesson } from '../types'
import { createDefaultState } from '../types'

const LESSONS_KEY = 'reader-lessons'

export function listLessons(): SavedLesson[] {
  try {
    const raw = localStorage.getItem(LESSONS_KEY)
    if (raw) return JSON.parse(raw) as SavedLesson[]
  } catch {
    /* ignore */
  }
  return []
}

export function saveLesson(name: string, state: DocumentState): SavedLesson {
  const lessons = listLessons()
  const { presentationMode, frozen, laserPointer, penTool, magnifier, ...data } = state
  const lesson: SavedLesson = {
    id: crypto.randomUUID(),
    name,
    savedAt: Date.now(),
    data: data as SavedLesson['data'],
  }
  lessons.unshift(lesson)
  localStorage.setItem(LESSONS_KEY, JSON.stringify(lessons.slice(0, 30)))
  return lesson
}

export function deleteLesson(id: string) {
  const lessons = listLessons().filter((l) => l.id !== id)
  localStorage.setItem(LESSONS_KEY, JSON.stringify(lessons))
}

export function loadLesson(id: string): DocumentState | null {
  const lesson = listLessons().find((l) => l.id === id)
  if (!lesson) return null
  return {
    ...createDefaultState(),
    ...lesson.data,
    presentationMode: false,
    frozen: false,
    laserPointer: false,
    penTool: false,
    magnifier: false,
  }
}
