import { ACT } from './act'
import { NSW } from './nsw'
import { QLD } from './qld'
import { SA } from './sa'
import { TAS } from './tas'
import { VIC } from './vic'
import { WA } from './wa'
import { dutyFor, dutyForRegime, landTaxFor } from './types'
import { money } from '../trace'

const ALL = [NSW, VIC, QLD, SA, WA, TAS, ACT]
let fails = 0
const check = (label: string, actual: number, expected: number, tol = 0.5) => {
  const ok = Math.abs(actual - expected) <= tol
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(56)} ${money(actual)} vs ${money(expected)}`)
}

// Each revenue office's OWN published figure. This is the strongest test there is:
// if our bands reproduce their arithmetic, the transcription is right.
console.log('\n=== Official published worked examples ===')
check('NSW  premium threshold $3,870,000', dutyFor(NSW.duty, 3_870_000), 194_137)
check('VIC  $7,000,000 (flat top band)', dutyFor(VIC.duty, 7_000_000), 435_000)
check('QLD  $850,000', dutyFor(QLD.duty, 850_000), 31_275)
check('SA   $600,000', dutyFor(SA.duty, 600_000), 26_830)
check('WA   $850,000', dutyFor(WA.duty, 850_000), 34_890.5)
check('WA   $1,000,000 (straddles top band)', dutyFor(WA.duty, 1_000_000), 42_615.5)
check('ACT  $3,000,000', dutyFor(ACT.duty, 3_000_000), 136_200)
check('TAS  land tax ALV $400,000', landTaxFor(TAS.landTax, 400_000, false), 1_287.5, 1)

console.log('\n=== Victoria flat band: the trap that motivated the framework ===')
// The $960k-$2M band is 5.5% of the WHOLE value, not of the excess.
check('VIC $1,000,000 = 5.5% of the whole value', dutyFor(VIC.duty, 1_000_000), 55_000)
check('VIC $2,000,000 = 5.5% of the whole value', dutyFor(VIC.duty, 2_000_000), 110_000)
const marginalWouldBe = 2_870 + (1_000_000 - 130_000) * 0.06
console.log(`  a marginal reading would give ${money(marginalWouldBe)} at $1M — understated by ${money(55_000 - marginalWouldBe)}`)

console.log('\n=== Commercial regime: the largest silent error available ===')
const saResid = dutyForRegime(SA, 3_000_000, 'residential')
const saComm = dutyForRegime(SA, 3_000_000, 'commercial')
console.log(`  SA  $3M residential ${money(saResid)}  commercial ${money(saComm)}`)
check('SA commercial duty is nil since 1 July 2018', saComm, 0)
console.log(`  ${saResid > 100_000 ? 'PASS' : 'FAIL'}  SA residential is still charged (${money(saResid)})`)
if (saResid <= 100_000) fails++

const actCommBelow = dutyForRegime(ACT, 2_100_000, 'commercial')
const actCommAbove = dutyForRegime(ACT, 2_100_001, 'commercial')
console.log(`  ACT commercial cliff: $2,100,000 -> ${money(actCommBelow)}, $2,100,001 -> ${money(actCommAbove)}`)
check('ACT commercial nil at the threshold', actCommBelow, 0)
check('ACT commercial 5% of WHOLE value just above', actCommAbove, 105_000, 1)

console.log('\n=== Cross-jurisdiction plausibility: duty on a $3,000,000 site ===')
const at3m = ALL.map((p) => [p.code, dutyFor(p.duty, 3_000_000)] as const).sort((a, b) => a[1] - b[1])
for (const [code, d] of at3m) console.log(`  ${code.padEnd(5)} ${money(d)}`)
const lo = at3m[0][1], hi = at3m[at3m.length - 1][1]
console.log(`  spread ${money(lo)} - ${money(hi)}`)
console.log(`  ${hi / lo < 2 ? 'PASS' : 'FAIL'}  no outlier (max/min = ${(hi / lo).toFixed(2)}x)`)
if (hi / lo >= 2) fails++

console.log('\n=== Every profile is structurally sound ===')
for (const p of ALL) {
  const bands = p.duty.bands
  const ordered = bands.every((b, i) => i === 0 || b.from === bands[i - 1].upTo)
  const topOpen = bands[bands.length - 1].upTo === Infinity
  const nonZero = dutyFor(p.duty, 1_000_000) > 0
  const ok = ordered && topOpen && nonZero
  if (!ok) fails++
  console.log(
    `  ${ok ? 'PASS' : 'FAIL'}  ${p.code.padEnd(5)} contiguous=${ordered} topOpen=${topOpen} $1M->${money(dutyFor(p.duty, 1_000_000))}  landtax $3M->${money(landTaxFor(p.landTax, 3_000_000, false))}`
  )
}

console.log('\n=== Only NSW may claim a Class 2 practitioner regime ===')
for (const p of ALL) {
  const claims = p.practitioners?.appliesToClass2 === true
  const ok = claims === (p.code === 'NSW')
  if (!ok) fails++
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${p.code.padEnd(5)} claimsClass2=${claims}`)
}

console.log(`\n${fails === 0 ? 'ALL CHECKS PASSED' : fails + ' CHECK(S) FAILED'}\n`)
