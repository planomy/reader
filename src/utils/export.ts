import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export async function exportStagePng(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
  })
  const link = document.createElement('a')
  link.download = `${filename}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export async function exportStagePdf(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, {
    backgroundColor: '#0a0a0f',
    scale: 2,
    useCORS: true,
  })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height],
  })
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
  pdf.save(`${filename}.pdf`)
}

export async function captureStage(element: HTMLElement): Promise<string> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#0a0a0f',
    scale: 1.5,
    useCORS: true,
  })
  return canvas.toDataURL('image/png')
}
