import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { FONTS } from '../data/fonts.js'
import { site } from '../data/site.js'
import '../styles/book3d.css'

const PAGE_W = 150
const PAGE_W_MOBILE = 110
const RISE_MS = 480
const CLOSE_COVER_MS = 340
const CLOSE_RETURN_MS = 480
const CLOSE_REVEAL_LEAD = 150
const TURN_MS = 580
const CLOSE_CROSSFADE_MS = 100
const PAD_X = 20
const PAD_TOP = 26
const PAD_BOTTOM = 22

function Block({ block, onImgLoad }) {
  switch (block.type) {
    case 'h':
      return <h3 className="book3d__block book3d__block--h">{block.text}</h3>
    case 'p':
      return <p className="book3d__block book3d__block--p">{block.text}</p>
    case 'list':
      return (
        <ul className="book3d__block book3d__block--list">
          {block.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )
    case 'link':
      return (
        <a
          className="book3d__block book3d__block--link"
          href={block.href}
          target="_blank"
          rel="noreferrer"
        >
          {block.text} →
        </a>
      )
    case 'img':
      return (
        <figure className="book3d__block book3d__block--img">
          <img src={block.src} alt={block.alt || ''} onLoad={onImgLoad} />
          {block.caption && (
            <figcaption className="book3d__block--imgCap">{block.caption}</figcaption>
          )}
        </figure>
      )
    default:
      return null
  }
}

function PageView({ data }) {
  if (!data) return <div className="book3d__pageBody book3d__pageBody--blank" />
  const chapterTitle = data.blocks[0]?.chapterTitle || ''
  return (
    <div className="book3d__pageBody">
      {chapterTitle && (
        <p className="book3d__kicker">{chapterTitle}</p>
      )}
      <div className="book3d__pageContent">
        {data.blocks.map((item, index) => (
          <div key={index} className="book3d__blockItem">
            <Block block={item.block} />
          </div>
        ))}
      </div>
    </div>
  )
}

function packBlocks(flat, heights, maxH) {
  const pages = []
  let cur = []
  let used = 0
  let lastChapter = -1
  for (let i = 0; i < flat.length; i++) {
    const h = heights[i] || 0
    const chapter = flat[i].chapterIndex
    if (cur.length && (used + h > maxH || chapter !== lastChapter || flat[i].block.new_page)) {
      pages.push(cur)
      cur = []
      used = 0
    }
    cur.push(i)
    used += h
    lastChapter = chapter
  }
  if (cur.length) pages.push(cur)
  return pages
}

export default forwardRef(function Book3D({ book, rect, skipAnim, onClose, onReveal, chunk }, ref) {
  const [pageIdx, setPageIdx] = useState(0)
  const [coverOpen, setCoverOpen] = useState(false)
  const [turn, setTurn] = useState(null)
  const [pageData, setPageData] = useState([])
  const [imgTick, setImgTick] = useState(0)
  const rootRef = useRef(null)
  const rigRef = useRef(null)
  const coverRef = useRef(null)
  const spreadRef = useRef(null)
  const backdropRef = useRef(null)
  const measureRefs = useRef(new Map())
  const turnTimer = useRef(null)
  const openedRef = useRef(skipAnim)
  const closingRef = useRef(false)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const onRevealRef = useRef(onReveal)
  onRevealRef.current = onReveal

  const { accent, ink, font, spine = 'solid' } = book
  const pageW = window.innerWidth < 640 ? PAGE_W_MOBILE : PAGE_W
  const coverW = pageW * 2
  const scale = Math.min(
    (window.innerHeight * 0.58) / book.height,
    (window.innerWidth * 0.78) / coverW,
    2,
  )
  const contentWidth = pageW - PAD_X * 2
  const maxH = book.height - PAD_TOP - PAD_BOTTOM - 36

  const flat = useMemo(
    () =>
      book.chapters.flatMap((c, ci) =>
        (c.content || []).map((block) => ({
          block,
          chapterIndex: ci,
          chapterTitle: c.title,
        })),
      ),
    [book],
  )

  useLayoutEffect(() => {
    let cancelled = false
    let rafId = 0
    const run = () => {
      if (cancelled) return
      const heights = flat.map((_, i) => measureRefs.current.get(i)?.offsetHeight || 0)
      let packed = packBlocks(flat, heights, maxH)
      if (!packed.length && book.pages) {
        packed = Array.from({ length: book.pages }, () => [])
      }
      setPageData(
        packed.map((g, gi) => ({
          number: gi + 1,
          blocks: g.map((bi) => flat[bi]),
        })),
      )
      setPageIdx(0)
      setTurn(null)
    }
    run()
    if (document.fonts?.ready) document.fonts.ready.then(run).catch(() => {})
    const onResize = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(run)
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
    }
  }, [book, contentWidth, maxH, flat, imgTick])

  useEffect(() => {
    const dx = window.innerWidth / 2 - (rect.left + rect.width / 2)
    const dy = window.innerHeight / 2 - (rect.top + rect.height / 2)

    const apply = () => {
      if (rootRef.current) {
        rootRef.current.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`
      }
      if (rigRef.current) rigRef.current.style.transform = 'rotateY(0deg)'
    }

    const openCover = () => {
      if (backdropRef.current) backdropRef.current.style.opacity = '1'
      openedRef.current = true
      setCoverOpen(true)
    }

    if (skipAnim) {
      apply()
      openCover()
      return undefined
    }

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(apply)
    })
    const openTimer = window.setTimeout(openCover, RISE_MS)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(openTimer)
    }
  }, [book, rect, scale, skipAnim])

  const requestClose = () => {
    if (closingRef.current || !openedRef.current) return
    closingRef.current = true
    if (skipAnim) {
      onCloseRef.current()
      return
    }
    if (spreadRef.current) spreadRef.current.style.opacity = '0'
    if (backdropRef.current) backdropRef.current.style.opacity = '0'
    if (rootRef.current) {
      rootRef.current.style.transition =
        'transform 0.48s cubic-bezier(0.3, 0.7, 0.3, 1), opacity 0.12s ease, perspective 0.48s cubic-bezier(0.3, 0.7, 0.3, 1)'
    }
    if (coverRef.current) {
      coverRef.current.style.transition =
        'transform 0.3s cubic-bezier(0.4, 0.1, 0.2, 1)'
    }
    setCoverOpen(false)
    window.setTimeout(() => {
      if (rigRef.current) rigRef.current.style.transform = 'rotateY(90deg)'
      if (rootRef.current) {
        rootRef.current.style.perspective = '150000px'
        rootRef.current.style.transform = `rotate(${book.tilt || 0}deg)`
      }
    }, CLOSE_COVER_MS)
    window.setTimeout(() => {
      onRevealRef.current?.(book.id)
      if (rootRef.current) rootRef.current.style.opacity = '0'
    }, CLOSE_COVER_MS + CLOSE_RETURN_MS - CLOSE_REVEAL_LEAD)
    window.setTimeout(
      () => onCloseRef.current(),
      CLOSE_COVER_MS + CLOSE_RETURN_MS + CLOSE_CROSSFADE_MS,
    )
  }

  useImperativeHandle(ref, () => ({ close: requestClose }))

  const handleForward = () => {
    if (turn || !coverOpen || pageIdx >= pageData.length - 1) return
    setTurn({ dir: 1, phase: 'start' })
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTurn((t) => (t && t.dir === 1 ? { ...t, phase: 'end' } : t))
      })
    })
    if (turnTimer.current) window.clearTimeout(turnTimer.current)
    turnTimer.current = window.setTimeout(() => {
      setPageIdx((index) => index + 1)
      setTurn(null)
    }, TURN_MS)
  }

  const handleBack = () => {
    if (turn || !coverOpen) return
    if (pageIdx === 0) {
      setCoverOpen(false)
      return
    }
    setTurn({ dir: -1, phase: 'start' })
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTurn((t) => (t && t.dir === -1 ? { ...t, phase: 'end' } : t))
      })
    })
    if (turnTimer.current) window.clearTimeout(turnTimer.current)
    turnTimer.current = window.setTimeout(() => {
      setPageIdx((index) => index - 1)
      setTurn(null)
    }, TURN_MS)
  }

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') requestClose()
      if (event.key === 'ArrowRight') handleForward()
      if (event.key === 'ArrowLeft') handleBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(
    () => () => {
      if (turnTimer.current) window.clearTimeout(turnTimer.current)
    },
    [],
  )

  const handleSpreadClick = (event) => {
    if (!coverOpen) {
      setCoverOpen(true)
      return
    }
    const center = window.innerWidth / 2
    if (event.clientX < center) handleBack()
    else handleForward()
  }

  const handleCoverClick = () => {
    if (closingRef.current || coverOpen) return
    setCoverOpen(true)
  }

  const showLeft =
    turn && turn.dir === -1 ? pageData[pageIdx - 2] : pageData[pageIdx - 1]
  const showRight =
    turn && turn.dir === 1 ? pageData[pageIdx + 1] : pageData[pageIdx]
  const turnData = turn
    ? turn.dir === 1
      ? pageData[pageIdx]
      : pageData[pageIdx - 1]
    : null

  const vars = {
    '--cover-w': `${coverW}px`,
    '--cover-h': `${book.height}px`,
    '--book-t': `${book.thickness}px`,
    '--page-w': `${pageW}px`,
    '--accent': accent,
    '--title-color': ink,
    '--title-font': FONTS[font] || FONTS.serif,
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  }

  return (
    <>
      <div
        className="book3d-backdrop"
        ref={backdropRef}
        onClick={requestClose}
        aria-hidden="true"
      />
      <div
        className={`book3d${skipAnim ? ' book3d--instant' : ''}`}
        ref={rootRef}
        style={vars}
        role="dialog"
        aria-modal="true"
        aria-label={`${book.title} book`}
        tabIndex={-1}
      >
        <div className="book3d__rig" ref={rigRef}>
          <div className="book3d__face book3d__back" />
          <div
            className="book3d__face book3d__peek"
            style={{ opacity: coverOpen ? 1 : 0 }}
            aria-hidden="true"
          />
          <div
            className="book3d__face book3d__spread"
            ref={spreadRef}
            style={{ opacity: coverOpen ? 1 : 0 }}
            onClick={handleSpreadClick}
          >
            <div className="book3d__page book3d__page--left">
              <PageView book={book} data={showLeft} />
            </div>
            <div className="book3d__page book3d__page--right">
              <PageView book={book} data={showRight} />
            </div>
            {turn && turnData && (
              <div
                className={`book3d__turn book3d__turn--${
                  turn.dir === 1 ? 'fwd' : 'back'
                }${turn.phase === 'end' ? ' book3d__turn--on' : ''}`}
                aria-hidden="true"
              >
                <div className="book3d__turn__face book3d__turn__front">
                  <PageView book={book} data={turnData} />
                </div>
                <div className="book3d__turn__face book3d__turn__back">
                  <PageView book={book} data={turnData} />
                </div>
              </div>
            )}
            {pageIdx > 0 && (
              <span className="book3d__chev book3d__chev--left" aria-hidden="true">
                ‹
              </span>
            )}
            {pageIdx < pageData.length - 1 && (
              <span className="book3d__chev book3d__chev--right" aria-hidden="true">
                ›
              </span>
            )}
          </div>
          <div className="book3d__face book3d__top" />
          <div className="book3d__face book3d__bottom" />
          <div className="book3d__face book3d__foreedge" />
          <div className={`book3d__face book3d__spine book--${spine}`}>
            <span className={`book3d__spineTitle book__title--${font}`}>
              {book.title}
            </span>
            {chunk && <span className="book3d__spineTag">{chunk}</span>}
          </div>
          <div
            className="book3d__face book3d__front"
            ref={coverRef}
            onClick={handleCoverClick}
            style={{
              transform: coverOpen
                ? 'translateZ(calc(var(--book-t) / 2)) rotateY(-178deg)'
                : 'translateZ(calc(var(--book-t) / 2))',
            }}
          >
            <div className="book3d__coverFrame" aria-hidden="true" />
            <span className="book3d__coverTitle">{book.title}</span>
            {site.publisher && <span className="book3d__coverTag">{site.publisher}</span>}
          </div>
        </div>
        <div
          className="book3d__measure"
          aria-hidden="true"
          style={{ width: contentWidth }}
        >
          {flat.map((item, index) => (
            <div
              key={index}
              className="book3d__measureItem"
              ref={(el) => {
                if (el) measureRefs.current.set(index, el)
                else measureRefs.current.delete(index)
              }}
            >
              <Block block={item.block} onImgLoad={() => setImgTick((t) => t + 1)} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
})