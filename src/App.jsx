import { useState } from 'react'
import Bookshelf from './components/Bookshelf.jsx'
import Book3D from './components/Book3D.jsx'
import { books } from './data/loadBooks.js'

const NAME = 'Your Name'
const TAGLINE = 'Choose a book to begin reading.'

export default function App() {
  const [opening, setOpening] = useState(null)
  const [revealedId, setRevealedId] = useState(null)

  const handleOpen = (book, element) => {
    if (opening) return
    const skipAnim = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setRevealedId(null)
    setOpening({
      book,
      rect: element.getBoundingClientRect(),
      skipAnim,
    })
  }

  return (
    <div className="scene">
      <header className="masthead">
      </header>
      <Bookshelf
        books={books}
        onOpen={handleOpen}
        hiddenId={opening && revealedId !== opening.book.id ? opening.book.id : null}
      />
      {opening && (
        <Book3D
          book={opening.book}
          rect={opening.rect}
          skipAnim={opening.skipAnim}
          onReveal={(id) => setRevealedId(id)}
          onClose={() => {
            setOpening(null)
            setRevealedId(null)
          }}
        />
      )}
    </div>
  )
}