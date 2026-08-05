'use client'

/**
 * The SIARE application shell.
 *
 * Three things it has to get right that the previous inline version did not:
 * the active nav item has to reflect where you actually are, the breadcrumb has
 * to say the same, and the whole thing has to survive a phone — a fixed 16rem
 * sidebar on a 375px screen leaves 7rem of content.
 */

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, PlusSquare, Settings } from 'lucide-react'

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  /** Breadcrumb trail shown in the header for this section. */
  crumbs: string[]
  /** Match nested routes too, e.g. /deals/123/edit under /deals. */
  match?: (pathname: string) => boolean
}

/**
 * Internal, analyst-facing routes only.
 *
 * The public tool at `/` deliberately has no navigation: it is a single-page
 * assessment on a public website, and a sidebar full of lender tooling is both
 * confusing to a visitor and not theirs to see. These routes are the credit
 * team's, reachable by URL, and they keep the shell.
 */
const NAV: NavItem[] = [
  {
    href: '/deals/new',
    label: 'New deal',
    icon: PlusSquare,
    crumbs: ['Credit', 'Deals', 'New'],
    match: (p) => p.startsWith('/deals'),
  },
  {
    href: '/settings/policy',
    label: 'Policy config',
    icon: Settings,
    crumbs: ['Credit', 'Policy'],
    match: (p) => p.startsWith('/settings'),
  },
]

/** True on the public assessment tool, which renders without any chrome. */
function isPublicApp(pathname: string): boolean {
  return pathname === '/' || pathname === '/feasibility'
}

function isActive(item: NavItem, pathname: string): boolean {
  return item.match ? item.match(pathname) : pathname.startsWith(item.href)
}

function Wordmark() {
  return (
    <Link href="/" className="block rounded-lg px-2 py-1 transition-colors hover:bg-white/5">
      <span className="block text-xl font-bold tracking-[0.2em] text-brand-400">SIARE</span>
      <span className="mt-0.5 block text-[10px] uppercase tracking-[0.25em] text-slate-400">
        Investments
      </span>
    </Link>
  )
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="space-y-1">
      {NAV.map((item) => {
        const active = isActive(item, pathname)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              active
                ? 'bg-brand-600/15 font-semibold text-brand-300'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarBody({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="p-4">
        <Wordmark />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <NavLinks pathname={pathname} onNavigate={onNavigate} />
      </div>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
            JS
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">Jules Smith</p>
            <p className="text-xs text-slate-500">Analyst</p>
          </div>
        </div>
      </div>
    </>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/'
  const [mobileOpen, setMobileOpen] = React.useState(false)

  // The public tool gets a slim branded bar and nothing else — no sidebar, no
  // breadcrumb, no account. One page, one job.
  if (isPublicApp(pathname)) {
    return (
      <div className="min-h-screen bg-app">
        <header className="border-b border-border bg-navy-900">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div>
              <span className="block text-base font-bold tracking-[0.2em] text-brand-400">
                SIARE
              </span>
              <span className="mt-0.5 block text-[9px] uppercase tracking-[0.25em] text-slate-400">
                Investments
              </span>
            </div>
            <span className="text-xs text-slate-400">Development Feasibility</span>
          </div>
        </header>
        <main>{children}</main>
      </div>
    )
  }

  const current = NAV.find((item) => isActive(item, pathname))
  const crumbs = current?.crumbs ?? ['Credit']

  return (
    <div className="flex min-h-screen bg-app">
      {/* Desktop sidebar. Fixed so a long results page scrolls under it rather
          than dragging the navigation off-screen with it. */}
      <aside className="hidden w-64 shrink-0 flex-col bg-navy-900 lg:flex lg:fixed lg:inset-y-0">
        <SidebarBody pathname={pathname} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
          {/* Mobile navigation. The sidebar is hidden under lg, so without this
              there is no way to leave the page you are on. */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            {/* text-white so the sheet's own close button stays visible
                against the navy ground — it inherits its colour. */}
            <SheetContent side="left" className="flex w-64 flex-col bg-navy-900 p-0 text-white">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBody pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex items-center gap-2 text-sm">
              {crumbs.map((crumb, i) => (
                <li key={crumb} className="flex items-center gap-2">
                  {i > 0 ? <span className="text-border">/</span> : null}
                  <span
                    className={cn(
                      'truncate',
                      i === crumbs.length - 1
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {crumb}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
