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
await new Promise((r) => setTimeout(r, 1500))

await page.$$eval('.book', (bs) => bs[0].click())
await new Promise((r) => setTimeout(r, 1600))

const t0 = Date.now()
await page.keyboard.press('Escape')
for (let i = 0; i < 20; i++) {
  const f = await page.evaluate(() => {
    const el = document.querySelector('.book3d')
    const shelf = document.querySelectorAll('.book')[0]
    return {
      has3d: !!el,
      b3dOp: el ? getComputedStyle(el).opacity : null,
      shelfOp: getComputedStyle(shelf).opacity,
    }
  })
  console.log(`+${String(Date.now() - t0).padStart(4)} has3d=${f.has3d} b3dOp=${f.b3dOp} shelfOp=${f.shelfOp}`)
  await new Promise((r) => setTimeout(r, 50))
}
await browser.close()
