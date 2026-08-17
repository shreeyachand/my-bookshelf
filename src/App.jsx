import { useCallback, useEffect, useRef, useState } from 'react'
import Bookshelf from './components/Bookshelf.jsx'
import Book3D from './components/Book3D.jsx'
import { books } from './data/loadBooks.js'
import { FONTS } from './data/fonts.js'
import { publisherChunksById, site } from './data/site.js'

const NAME = 'Your Name'
const TAGLINE = 'Choose a book to begin reading.'

function bookIdFromPath() {
  return window.location.pathname.split('/').filter(Boolean)[0] || null
}

export default function App() {
  const [opening, setOpening] = useState(null)
  const [revealedId, setRevealedId] = useState(null)
  const openingRef = useRef(null)
  const bookEls = useRef(new Map())
  const book3dRef = useRef(null)
  const pushedRef = useRef(false)
  const didInitRef = useRef(false)
  const [chunks, setChunks] = useState({})

  useEffect(() => {
    document.title = site.title
  }, [])

  useEffect(() => {
    const build = () => setChunks(publisherChunksById(books, site.publisher, FONTS.sans))
    build()
    if (document.fonts?.ready) document.fonts.ready.then(build).catch(() => {})
  }, [])

  const openBook = useCallback((book, element, mode) => {
    if (openingRef.current?.book.id === book.id) return
    const skipAnim = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const next = { book, rect: element.getBoundingClientRect(), skipAnim }
    openingRef.current = next
    setOpening(next)
    setRevealedId(null)
    if (mode === 'push') {
      pushedRef.current = true
      window.history.pushState(null, '', `/${book.id}`)
    } else {
      pushedRef.current = false
      const target = `/${book.id}`
      if (window.location.pathname !== target) {
        window.history.replaceState(null, '', target)
      }
    }
  }, [])

  const handleOpen = useCallback(
    (book, element) => openBook(book, element, 'push'),
    [openBook],
  )

  const handleClose = useCallback(() => {
    openingRef.current = null
    setOpening(null)
    setRevealedId(null)
    if (window.location.pathname !== '/') {
      if (pushedRef.current) window.history.back()
      else window.history.replaceState(null, '', '/')
    }
  }, [])

  const registerEl = useCallback((id, el) => {
    if (el) bookEls.current.set(id, el)
    else bookEls.current.delete(id)
  }, [])

  useEffect(() => {
    const syncFromUrl = () => {
      const id = bookIdFromPath()
      const book = books.find((b) => b.id === id)
      if (book) {
        const el = bookEls.current.get(id)
        if (el) openBook(book, el, 'sync')
      } else if (openingRef.current) {
        book3dRef.current?.close()
      }
    }
    if (!didInitRef.current) {
      didInitRef.current = true
      syncFromUrl()
    }
    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [openBook])

  return (
    <div className="scene">
      <header className="masthead">
      </header>
      <Bookshelf
        books={books}
        onOpen={handleOpen}
        hiddenId={opening && revealedId !== opening.book.id ? opening.book.id : null}
        registerEl={registerEl}
        chunks={chunks}
      />
      {opening && (
        <Book3D
          ref={book3dRef}
          book={opening.book}
          rect={opening.rect}
          skipAnim={opening.skipAnim}
          onReveal={(id) => setRevealedId(id)}
          onClose={handleClose}
          chunk={chunks[opening.book.id]}
        />
      )}
    </div>
  )
}