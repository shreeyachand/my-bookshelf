import Book from './Book.jsx'
import '../styles/bookshelf.css'

export default function Bookshelf({ books, onOpen, hiddenId, registerEl, chunks }) {
  return (
    <div className="bookshelf">
      <div className="bookshelf__books">
        {books.map((book) => (
          <Book
            key={book.id}
            book={book}
            hidden={hiddenId === book.id}
            onOpen={onOpen}
            registerEl={registerEl}
            chunk={chunks[book.id]}
          />
        ))}
      </div>
      <div className="bookshelf__plank" aria-hidden="true" />
    </div>
  )
}