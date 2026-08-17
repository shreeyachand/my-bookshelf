import { FONTS } from '../data/fonts.js'

export default function Book({ book, onOpen, hidden, registerEl }) {
  const {
    title,
    accent,
    ink,
    font,
    tag,
    height,
    thickness,
    tilt = 0,
    spine = 'solid',
  } = book
  const style = {
    width: thickness,
    height,
    '--accent': accent,
    '--title-color': ink,
    '--title-font': FONTS[font] || FONTS.serif,
    '--tilt': `${tilt}deg`,
  }

  return (
    <button
      type="button"
      className={`book book--${spine}${hidden ? ' book--hidden' : ''}`}
      style={style}
      ref={(el) => registerEl?.(book.id, el)}
      onClick={(event) => onOpen(book, event.currentTarget)}
      aria-label={`Open the ${title} book`}
    >
      <span className={`book__title book__title--${font}`}>{title}</span>
      {tag && <span className="book__tag">{tag}</span>}
    </button>
  )
}