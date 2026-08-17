import Book from './Book.jsx'
import '../styles/bookshelf.css'

export default function Bookshelf({ books, onOpen, hiddenId }) {
  return (
    <div className="bookshelf">
      <div className="bookshelf__books">
        {books.map((book) => (
          <Book
            key={book.id}
            book={book}
            hidden={hiddenId === book.id}
            onOpen={onOpen}
          />
        ))}
      </div>
      <div className="bookshelf__plank" aria-hidden="true" />
    </div>
  )
}