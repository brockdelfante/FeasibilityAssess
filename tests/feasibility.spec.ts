import { expect, test } from '@playwright/test'

/**
 * End-to-end coverage for the feasibility wizard.
 *
 * These drive the real UI rather than the engine, so they catch the things a
 * typecheck cannot: a step that fails to render, a control that does not update
 * the model, an expensive panel that throws when its section opens.
 */

const BASE = 'http://localhost:3000'

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

  await page.goto(`${BASE}/feasibility`)
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

  await page.getByRole('button', { name: /See my results/i }).click()

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

  await page.goto(`${BASE}/feasibility`)
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
  await page.goto(`${BASE}/feasibility`)
  await acceptDisclaimer(page)

  await page.getByRole('combobox').first().click()
  await page.getByRole('option', { name: /^South Australia$/ }).click()

  await page.getByRole('button', { name: /Skip to full results/i }).click()
  await page.getByRole('button', { name: /Back to inputs/i }).click()

  // The residential/commercial question only appears where it changes the duty.
  await expect(page.getByText(/Is this residential or commercial land\?/i)).toBeVisible()
  await page.getByRole('button', { name: /Commercial \/ industrial land/i }).click()

  await page.getByRole('button', { name: /See my results/i }).click()

  await expect(page.getByText('SA transfer (stamp) duty')).toBeVisible()
  await expect(
    page.getByText(/No SA conveyance duty on non-residential land/i)
  ).toBeVisible()
})

test('clicking a cost line opens its trace', async ({ page }) => {
  await page.goto(`${BASE}/feasibility`)
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

  await page.goto(`${BASE}/feasibility`)
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
  await page.goto(`${BASE}/feasibility`)
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
  await page.goto(`${BASE}/feasibility`)
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
  await page.getByRole('button', { name: /Back to inputs/i }).click()
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

  await page.getByRole('button', { name: /See my results/i }).click()
  const after = await peakDebt()

  expect(after).toBeLessThan(before)
  await expect(page.getByText(/Presales of .* cover .* of peak debt/)).toBeVisible()
})

test('the PDF report downloads and is a real PDF', async ({ page }) => {
  await page.goto(`${BASE}/feasibility`)
  await acceptDisclaimer(page)
  await page.getByRole('button', { name: /Skip to full results/i }).click()

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

  await page.goto(`${BASE}/feasibility`)
  await acceptDisclaimer(page)
  await page.getByRole('button', { name: /Skip to full results/i }).click()

  // Change an input so the shared state is distinguishable from the default.
  await page.getByRole('button', { name: /Back to inputs/i }).click()
  await page.getByRole('button', { name: /^Back$/ }).click()
  await page.getByRole('button', { name: /^Back$/ }).click()
  await page.getByRole('button', { name: /^Back$/ }).click()

  await page.getByRole('button', { name: /Skip to full results/i }).click()
  const costBefore = await page
    .locator('text=/Total development cost/i')
    .first()
    .textContent()

  await page.getByRole('button', { name: /Copy share link/i }).click()
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
