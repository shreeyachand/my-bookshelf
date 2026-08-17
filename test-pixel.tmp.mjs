import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-dev-shm-usage'],
})
const page = await browser.newPage()
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message))
await page.setViewport({ width: 1280, height: 800 })
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 800))
await page.$$eval('.book', (bs) => bs[0].click())
await new Promise((r) => setTimeout(r, 1800))

const pixel = await page.evaluate(async () => {
  const canvas = document.createElement('canvas')
  canvas.width = 1280; canvas.height = 800
  const ctx = canvas.getContext('2d')
  ctx.drawWindow(window, 0, 0, 1280, 800)
  const grab = (x, y) => {
    const d = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data
    return `rgb(${d[0]},${d[1]},${d[2]})`
  }
  return {
    rightPageCenter: grab(800, 400),
    leftPageCenter: grab(480, 400),
    coverAreaFarLeft: grab(340, 400),
    outsideRight: grab(1000, 400),
  }
})
console.log(JSON.stringify(pixel))

const coverTransform = await page.evaluate(() => {
  const c = document.querySelector('.book3d__front')
  return c ? getComputedStyle(c).transform : null
})
console.log('cover transform:', coverTransform)
await browser.close()
