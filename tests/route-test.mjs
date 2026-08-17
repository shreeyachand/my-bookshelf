import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const base = 'http://localhost:5173'

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

const results = []

// 1. Direct load of /writing
await page.goto(`${base}/writing`, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 300))
const direct = await page.evaluate(() => ({
  book3d: !!document.querySelector('.book3d'),
  coverOpen: !!document.querySelector('.book3d__front') &&
    getComputedStyle(document.querySelector('.book3d__front')).transform.includes('rotateY(-178deg)'),
  url: location.pathname,
}))
results.push(['direct /writing opens book3d + cover', direct.book3d && direct.coverOpen])
results.push(['direct url stays /writing', direct.url === '/writing'])

// close it via backdrop
await page.click('.book3d-backdrop')
await new Promise((r) => setTimeout(r, 1000))
const afterClose = await page.evaluate(() => ({
  book3d: !!document.querySelector('.book3d'),
  url: location.pathname,
}))
results.push(['backdrop close removes book3d', !afterClose.book3d])
results.push(['close on direct-load replaces to /', afterClose.url === '/'])

// 2. Click a shelf book -> URL updates
await page.goto(base, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 300))
await page.evaluate(() => {
  const books = [...document.querySelectorAll('.book')]
  const b = books.find((x) => x.textContent.includes('Reading'))
  b.click()
})
await new Promise((r) => setTimeout(r, 300))
const clicked = await page.evaluate(() => ({
  url: location.pathname,
  book3d: !!document.querySelector('.book3d'),
}))
results.push(['click pushes /reading', clicked.url === '/reading' && clicked.book3d])

// 3. browser back -> closes via popstate
await page.goBack()
await new Promise((r) => setTimeout(r, 1000))
const back = await page.evaluate(() => ({
  url: location.pathname,
  book3d: !!document.querySelector('.book3d'),
}))
results.push(['back button closes book', back.url === '/' && !back.book3d])

for (const [name, ok] of results) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
if (results.some(([, ok]) => !ok)) process.exitCode = 1
await browser.close()