import YAML from 'yaml'
import raw from './site.yaml?raw'

export const site = YAML.parse(raw)

export function publisherChunksById(orderedBooks, publisher, fontFamily) {
  const name = publisher.replace(/\s+/g, ' ').trim()
  const nameWithSpace = name + ' '
  const fontSize = 8
  const letterSpacing = fontSize * 0.28
  const ctx = document.createElement('canvas').getContext('2d')
  ctx.font = `600 ${fontSize}px ${fontFamily}`
  const rawWidth = ctx.measureText(nameWithSpace).width
  const glyphAvg = (rawWidth - letterSpacing * (nameWithSpace.length - 1)) / nameWithSpace.length
  const perChar = glyphAvg + letterSpacing
  const chunks = {}
  let cursor = 0
  for (const book of orderedBooks) {
    const pad = Math.min(11, book.thickness * 0.38)
    const width = book.thickness - pad
    let n = Math.max(1, Math.floor(width / perChar))
    let chunk = ''
    for (let i = 0; i < n; i++) {
      chunk += nameWithSpace[cursor % nameWithSpace.length]
      cursor++
    }
    if (!/\S/.test(chunk)) {
      chunk += nameWithSpace[cursor % nameWithSpace.length]
      cursor++
    }
    chunks[book.id] = chunk
  }
  return chunks
}