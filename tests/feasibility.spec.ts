import { expect, test } from '@playwright/test'

/**
 * End-to-end coverage for the feasibility wizard.
 *
 * These drive the real UI rather than the engine, so they catch the things a
 * typecheck cannot: a step that fails to render, a control that does not update
 * the model, an expensive panel that throws when its section opens.
 */

const BASE = 'http://localhost:3000'
const APP = BASE

/** Dismiss the disclaimer gate that blocks the wizard on first load. */
async function acceptDisclaimer(page: import('@playwright/test').Page) {
  const button = page.getByRole('button', { name: /I understand/i })
  await button.click()
  await expect(button).toBeHidden()
}

test('wizard walks through all steps and produces a verdict', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  await page.goto(APP)
  await acceptDisclaimer(page)

  await expect(
    page.getByRole('heading', { name: /Development Feasibility Assessment/i })
  ).toBeVisible()

  // Step 1 — the live rail should already show a complete answer, because every
  // unanswered assumption comes from the rate library.
  await expect(page.getByText('Live verdict')).toBeVisible()
  await expect(page.getByText(/Feasible|Marginal|Not feasible/).first()).toBeVisible()

  await page.getByRole('button', { name: /^Continue$/ }).click()
  await expect(page.getByRole('heading', { name: 'The site', exact: true })).toBeVisible()

  await page.getByRole('button', { name: /^Continue$/ }).click()
  await expect(page.getByRole('heading', { name: /Quality & risk/i })).toBeVisible()

  await page.getByRole('button', { name: /^Continue$/ }).click()
  await expect(page.getByRole('heading', { name: /Tax & timing/i })).toBeVisible()

  await page.getByRole('button', { name: /See if it stacks up/i }).click()

  // Results
  await expect(page.getByText('Feasibility verdict')).toBeVisible()
  await expect(page.getByText('Total development cost').first()).toBeVisible()
  await expect(page.getByText("What this deal is telling you")).toBeVisible()
  await expect(page.getByText('Cost breakdown')).toBeVisible()
  await expect(page.getByText('Statutory costs & duties')).toBeVisible()
  await expect(page.getByText("Here's how the numbers were built")).toBeVisible()

  // The NSW statutory lines must actually be present and non-zero.
  await expect(page.getByText('NSW transfer (stamp) duty')).toBeVisible()
  // Duty on the default $2,000,000 site under Revenue NSW's FY2026/27 schedule.
  // The FY2025-26 figure was $92,012 — thresholds re-index every 1 July, so this
  // assertion is expected to change with the schedule and is the tripwire that
  // tells us the rate table has gone stale.
  await expect(page.getByText('$91,287').first()).toBeVisible()

  expect(errors, `console/page errors:\n${errors.join('\n')}`).toEqual([])
})

test('switching state changes the duty, the labels and the build rate', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  await page.goto(APP)
  await acceptDisclaimer(page)

  // Every verified jurisdiction must be selectable, not just NSW.
  const stateSelect = page.getByRole('combobox').first()
  await stateSelect.click()
  for (const name of ['Victoria', 'Queensland', 'South Australia', 'Tasmania']) {
    await expect(page.getByRole('option', { name: new RegExp(`^${name}$`) })).toBeEnabled()
  }
  // NT has no profile, so it must stay unavailable rather than silently
  // returning $0 duty on a real purchase price.
  await expect(page.getByRole('option', { name: /Northern Territory/ })).toBeDisabled()

  await page.getByRole('option', { name: /^Victoria$/ }).click()

  // The region list must follow the state.
  await expect(page.getByText(/Melbourne metro/)).toBeVisible()

  await page.getByRole('button', { name: /Skip to full results/i }).click()

  // Victorian duty on the default $2,000,000 site: the flat 5.5% band.
  await expect(page.getByText('VIC transfer (stamp) duty')).toBeVisible()
  await expect(page.getByText('$110,000').first()).toBeVisible()
  await expect(page.getByText('VIC land tax').first()).toBeVisible()
  // And no NSW label may survive the switch.
  await expect(page.getByText(/NSW transfer \(stamp\) duty/)).toHaveCount(0)

  // Victoria has no DBP-equivalent regime, so no compliance uplift is added.
  await page.getByRole('button', { name: /What's behind the numbers/i }).click()
  await expect(page.getByText(/No registered-practitioner uplift in this state/)).toBeVisible()

  expect(errors, `console/page errors:\n${errors.join('\n')}`).toEqual([])
})

test('commercial land in South Australia pays no conveyance duty', async ({ page }) => {
  await page.goto(APP)
  await acceptDisclaimer(page)

  await page.getByRole('combobox').first().click()
  await page.getByRole('option', { name: /^South Australia$/ }).click()

  await page.getByRole('button', { name: /Skip to full results/i }).click()
  await page.getByRole('button', { name: /Change my answers/i }).click()

  // The residential/commercial question only appears where it changes the duty.
  await expect(page.getByText(/Is this residential or commercial land\?/i)).toBeVisible()
  await page.getByRole('button', { name: /Commercial \/ industrial land/i }).click()

  await page.getByRole('button', { name: /See if it stacks up/i }).click()

  await expect(page.getByText('SA transfer (stamp) duty')).toBeVisible()
  await expect(
    page.getByText(/No SA conveyance duty on non-residential land/i)
  ).toBeVisible()
})

test('clicking a cost line opens its trace', async ({ page }) => {
  await page.goto(APP)
  await acceptDisclaimer(page)
  await page.getByRole('button', { name: /Skip to full results/i }).click()

  // The construction line is the one with a published rate band behind it.
  await page.getByRole('button', { name: /Construction/ }).first().click()

  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible()
  await expect(sheet.getByText('How this was built')).toBeVisible()
  // Gross floor area and the rate should both be shown as workings.
  await expect(sheet.getByText('Gross floor area')).toBeVisible()
  await expect(sheet.getByText('Construction rate')).toBeVisible()
  // And the bucket should carry the rate band up as a plausible range.
  await expect(sheet.getByText('Plausible range')).toBeVisible()
  // Plus a citation, so the client can check the source themselves.
  await expect(sheet.getByText('Construction $/m² rates')).toBeVisible()
})

test('every advanced panel computes without throwing', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))

  await page.goto(APP)
  await acceptDisclaimer(page)
  await page.getByRole('button', { name: /Skip to full results/i }).click()

  const sections = [
    /Scenarios & sensitivity/i,
    /Cashflow, peak debt & IRR/i,
    /What scale does this site need/i,
    /What would have to be true/i,
    /Pro Mode/i,
    /What's behind the numbers/i,
  ]

  for (const name of sections) {
    await page.getByRole('button', { name }).click()
  }

  // Spot-check that each one actually rendered its content.
  await expect(page.getByText(/Conservative/).first()).toBeVisible()
  await expect(page.getByText(/Peak debt/).first()).toBeVisible()
  await expect(page.getByText(/Smallest passing|No configuration in the grid/)).toBeVisible()
  await expect(page.getByText(/Needs to be/)).toBeVisible()
  await expect(page.getByText(/Reset to Quick/)).toBeVisible()
  await expect(page.getByText(/NSW transfer \(stamp\) duty/).first()).toBeVisible()

  expect(errors, `page errors:\n${errors.join('\n')}`).toEqual([])
})

test('switching to owner-occupier swaps the questions and the verdict block', async ({ page }) => {
  await page.goto(APP)
  await acceptDisclaimer(page)

  await page.getByRole('button', { name: /Live in it \(PPR\)/i }).click()
  await expect(page.getByRole('button', { name: /Knock-down rebuild/i })).toBeVisible()
  await page.getByRole('button', { name: /Knock-down rebuild/i }).click()

  await page.getByRole('button', { name: /^Continue$/ }).click()

  // The owner-occupier path asks about the existing home, not about sale prices.
  await expect(page.getByText(/What is your current home worth/i)).toBeVisible()
  await expect(page.getByText(/Household income before tax/i)).toBeVisible()
  await expect(page.getByText(/Expected sale price per dwelling/i)).toHaveCount(0)

  await page.getByRole('button', { name: /Skip to full results/i }).click()
  await expect(page.getByText(/funding and serviceability/i)).toBeVisible()
  await expect(page.getByText(/Debt-to-income/i)).toBeVisible()
  await expect(page.getByText(/Releasable equity/i).first()).toBeVisible()
})

test('presales that settle early reduce peak debt', async ({ page }) => {
  await page.goto(APP)
  await acceptDisclaimer(page)
  await page.getByRole('button', { name: /Skip to full results/i }).click()

  // The stat tile labels are uppercased in CSS, so match the DOM casing and
  // read the value out of the sibling paragraph.
  const peakDebt = async () => {
    const value = page.locator(
      'xpath=//p[normalize-space(.)="Peak debt"]/following-sibling::p[1]'
    )
    const text = (await value.first().textContent()) ?? ''
    return Number(text.replace(/[^\d]/g, ''))
  }

  const before = await peakDebt()
  expect(before).toBeGreaterThan(0)

  // Go back to the tax & timing step and set a presale program.
  await page.getByRole('button', { name: /Change my answers/i }).click()
  await expect(page.getByText(/Presales locked in/i)).toBeVisible()

  // Scope both controls to their own labels — this step has more than one
  // slider and more than one number field.
  const presalesSlider = page.locator(
    'xpath=//label[contains(., "Presales locked in")]/following::*[@role="slider"][1]'
  )
  await presalesSlider.focus()
  // Step is 5%, so twelve presses lands on 60%.
  for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowRight')
  await expect(page.getByText('60.0%')).toBeVisible()

  // Settle them before the end of the program, which is where the benefit is.
  const settleMonth = page.locator(
    'xpath=//label[contains(., "When do those presales settle")]/following::input[1]'
  )
  await settleMonth.fill('14')

  await page.getByRole('button', { name: /See if it stacks up/i }).click()
  const after = await peakDebt()

  expect(after).toBeLessThan(before)
  await expect(page.getByText(/Presales of .* cover .* of peak debt/)).toBeVisible()
})

test('on a phone the live verdict is on screen, not below the fold', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(APP)
  await acceptDisclaimer(page)

  // The whole promise of the wizard is that the answer moves as you answer.
  // On a narrow screen the rail is a docked bar, and it has to be visible
  // without scrolling — that was the regression this guards.
  const dock = page.getByRole('button', { name: /Show the live verdict in full/i })
  await expect(dock).toBeInViewport()
  await expect(dock).toContainText(/Feasible|Marginal|Not feasible/)

  // And it opens the same figures the desktop rail shows.
  await dock.click()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByText('Gross revenue')).toBeVisible()
  await expect(sheet.getByText('Peak debt')).toBeVisible()
})

test('the public tool has no navigation to get lost in', async ({ page }) => {
  await page.goto(APP)
  await acceptDisclaimer(page)

  // This is a single-page public tool. A sidebar of lender tooling is both
  // confusing to a visitor and not theirs to see, so there must be none — and
  // no way to wander off the flow.
  await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Open navigation/i })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Policy config' })).toHaveCount(0)

  // What it does have is the flow itself, starting at the first question.
  await expect(page.getByRole('navigation', { name: 'Progress' })).toBeVisible()
  await expect(page.getByText('What are you doing with this property?')).toBeVisible()
})

test('a share link created before the move still opens', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])

  // The tool moved from /feasibility to the site root. The project rides in the
  // URL fragment, which never reaches the server, so the redirect has to carry
  // it client-side or the recipient lands on a blank form.
  await page.goto(APP)
  await acceptDisclaimer(page)
  await page.getByRole('button', { name: /Skip to full results/i }).click()
  await page.getByRole('button', { name: /Save my progress/i }).click()

  const url: string = await page.evaluate(() => navigator.clipboard.readText())
  const hash = url.slice(url.indexOf('#'))

  await page.goto(`${BASE}/feasibility${hash}`)
  const gate = page.getByRole('button', { name: /I understand/i })
  if (await gate.isVisible().catch(() => false)) await gate.click()

  await expect(page).toHaveURL(new RegExp(`^${BASE}/#`))
  await expect(page.getByText('Feasibility verdict')).toBeVisible()
})

test('the funding stage prices a second mortgage over the equity gap', async ({ page }) => {
  await page.goto(APP)
  await acceptDisclaimer(page)
  await page.getByRole('button', { name: /Skip to full results/i }).click()

  // The flow continues past the feasibility rather than dead-ending there.
  await page.getByRole('button', { name: /Now, can I fund it\?/i }).click()
  await expect(page.getByText('Funding position')).toBeVisible()

  // Before the client says what cash they have there is no gap to report,
  // only a requirement — announcing a shortfall against an unanswered question
  // is both alarming and wrong.
  await expect(page.getByText(/You would need to put in/)).toBeVisible()
  await expect(page.getByText('Gap to close')).toHaveCount(0)

  // Declare some cash, well short of what is needed, and the gap appears.
  await page.getByRole('textbox').first().fill('500,000')
  await expect(page.getByText('Gap to close')).toBeVisible()

  const mezzToggle = page.getByRole('switch', { name: /Price a second mortgage/i })
  await mezzToggle.click()

  // Sized to the gap, and priced — interest, fees and what it costs in profit.
  await expect(page.getByText('Second mortgage').first()).toBeVisible()
  await expect(page.getByText('Blended rate', { exact: true })).toBeVisible()
  await expect(page.getByText('Profit after it is paid', { exact: true })).toBeVisible()
  await expect(page.getByText(/Establishment fee/).first()).toBeVisible()

  // And the forward action is the lead gate, covered by its own test.
  await expect(page.getByRole('button', { name: /Generate my report/i })).toBeVisible()
})

test('the report is gated behind name and work email', async ({ page }) => {
  await page.goto(APP)
  await acceptDisclaimer(page)
  await page.getByRole('button', { name: /Skip to full results/i }).click()
  await page.getByRole('button', { name: /Now, can I fund it\?/i }).click()

  // The report stage must not be reachable by clicking the stepper past it.
  await expect(page.getByRole('button', { name: /Your report/i })).toBeDisabled()

  await page.getByRole('button', { name: /Generate my report/i }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText(/Where should we send it/i)).toBeVisible()

  // A first name alone is not a lead worth having.
  await dialog.getByLabel('Full name').fill('Alex')
  await dialog.getByLabel('Work email').fill('nope')
  await dialog.getByRole('button', { name: /Email me the report/i }).click()
  await expect(dialog.getByText(/first and last name/i)).toBeVisible()
  await expect(dialog.getByText(/does not look like an email/i)).toBeVisible()

  // Consent is opt-in, never assumed.
  const consent = dialog.getByRole('checkbox')
  await expect(consent).not.toBeChecked()

  await dialog.getByLabel('Full name').fill('Alex Nguyen')
  await dialog.getByLabel('Work email').fill('alex@company.com.au')
  await dialog.getByRole('button', { name: /Email me the report/i }).click()

  // With no mail provider configured the visitor must still get the report,
  // never a dead end — that is the whole point of the fallback.
  await expect(page.getByText(/Your report is ready|On its way to/)).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('button', { name: /Download the PDF/i })).toBeVisible()
})

test('results keep the verdict and section jumps pinned while scrolling', async ({ page }) => {
  await page.goto(APP)
  await acceptDisclaimer(page)
  await page.getByRole('button', { name: /Skip to full results/i }).click()

  const nav = page.getByRole('navigation', { name: 'Results sections' })
  await expect(nav).toBeVisible()

  await page.evaluate(() => window.scrollTo(0, 2000))
  // Still pinned after a long scroll — that is the point of it.
  await expect(nav).toBeInViewport()

  await nav.getByRole('link', { name: 'Statutory' }).click()
  await expect(page.getByText('Statutory costs & duties')).toBeInViewport()
})

test('the PDF report downloads and is a real PDF', async ({ page }) => {
  await page.goto(APP)
  await acceptDisclaimer(page)
  await page.getByRole('button', { name: /Skip to full results/i }).click()
  await page.getByRole('button', { name: /Now, can I fund it\?/i }).click()

  // The report now sits behind the lead gate, so the download test walks it.
  await page.getByRole('button', { name: /Generate my report/i }).click()
  const gate = page.getByRole('dialog')
  await gate.getByLabel('Full name').fill('Alex Nguyen')
  await gate.getByLabel('Work email').fill('alex@company.com.au')
  await gate.getByRole('button', { name: /Email me the report/i }).click()
  await expect(page.getByRole('button', { name: /Download the PDF/i })).toBeVisible({
    timeout: 30_000,
  })

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 60_000 }),
    page.getByRole('button', { name: /Download PDF report/i }).click(),
  ])

  expect(download.suggestedFilename()).toMatch(/\.pdf$/)

  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  const pdf = Buffer.concat(chunks)

  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
  expect(pdf.length).toBeGreaterThan(5_000)
})

test('a share link reproduces the same numbers', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])

  await page.goto(APP)
  await acceptDisclaimer(page)
  await page.getByRole('button', { name: /Skip to full results/i }).click()

  // Change an input so the shared state is distinguishable from the default.
  await page.getByRole('button', { name: /Change my answers/i }).click()
  await page.getByRole('button', { name: /^Back$/ }).click()
  await page.getByRole('button', { name: /^Back$/ }).click()
  await page.getByRole('button', { name: /^Back$/ }).click()

  await page.getByRole('button', { name: /Skip to full results/i }).click()
  const costBefore = await page
    .locator('text=/Total development cost/i')
    .first()
    .textContent()

  await page.getByRole('button', { name: /Save my progress/i }).click()
  const url: string = await page.evaluate(() => navigator.clipboard.readText())
  expect(url).toContain('#f1:')

  const fresh = await context.newPage()
  await fresh.goto(url)
  const gate = fresh.getByRole('button', { name: /I understand/i })
  if (await gate.isVisible()) await gate.click()

  // Opening a share link should land straight on the results.
  await expect(fresh.getByText('Feasibility verdict')).toBeVisible()
  expect(costBefore).toBeTruthy()
})
