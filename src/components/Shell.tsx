/**
 * The app shell: dark sidebar (the one strong brand surface), top bar with
 * breadcrumbs, and the page frame every screen sits in.
 */
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { course, modules, professor, student } from '../data/alpineOat'
import type { Mode } from '../data/alpineOat'
import { cx, useDemo } from '../lib/demo'
import { Icon, Logo } from './Icon'
import type { IconName } from './Icon'
import { ModeChip, Tag } from './ui'

// ---------------------------------------------------------------- sidebar

function NavItem({
  icon,
  label,
  to,
  active = false,
  count,
}: {
  icon: IconName
  label: string
  /** Without a target the item is shown but not part of the demo. */
  to?: string
  active?: boolean
  count?: number
}) {
  const { notInDemo } = useDemo()
  const className = cx(
    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-left text-[14px] text-side-ink',
    'transition-colors duration-150 ease-std focus-visible:outline-white',
    active ? 'bg-white/[.14] font-semibold shadow-[inset_3px_0_0_#fff]' : 'hover:bg-white/[.07]',
  )
  const content = (
    <>
      <Icon name={icon} size={17} />
      {label}
      {count !== undefined && <span className="num ml-auto text-[12px] font-normal text-side-mut">{count}</span>}
    </>
  )
  return to ? (
    <Link to={to} className={className} aria-current={active ? 'page' : undefined}>
      {content}
    </Link>
  ) : (
    <button type="button" className={className} onClick={() => notInDemo()}>
      {content}
    </button>
  )
}

function NavGroup({ children }: { children: ReactNode }) {
  return <div className="px-2.5 pb-1.5 pt-3.5 text-[12.5px] font-semibold text-side-mut">{children}</div>
}

const moduleIcons: Record<string, IconName> = {
  segmentation: 'segmentation',
  positioning: 'positioning',
  conjoint: 'conjoint',
}

/** Name block at the bottom of the sidebar. In the demo it also switches between the two roles. */
function UserMenu({ isProfessor }: { isProfessor: boolean }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { restart } = useDemo()
  const me = isProfessor ? professor : student

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const go = (to: string) => {
    setOpen(false)
    navigate(to)
  }

  const roles = [
    { person: student, to: '/', current: !isProfessor },
    { person: professor, to: '/professor/assignment', current: isProfessor },
  ]

  return (
    <div ref={box} className="relative mt-3 border-t border-white/[.14] pt-2">
      {open && (
        <div className="fade-in absolute inset-x-0 bottom-full mb-2 rounded-lg border border-line bg-white p-1.5 text-ink shadow-[0_8px_24px_rgba(27,34,48,.22)]">
          <div className="px-2.5 pb-1 pt-1.5 text-[12px] font-semibold text-ink3">Demo: view the product as</div>
          {roles.map(({ person, to, current }) => (
            <button
              key={person.name}
              type="button"
              onClick={() => go(to)}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors duration-150 ease-std hover:bg-fill"
            >
              <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-primary-t text-[11.5px] font-bold text-primary-d">
                {person.initials}
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-[13.5px] font-semibold leading-tight">{person.name}</b>
                <span className="text-[12.5px] text-ink3">{person.role}</span>
              </span>
              {current && <Icon name="check" size={15} className="text-primary" />}
            </button>
          ))}
          <div className="my-1 h-px bg-line2" />
          <button
            type="button"
            onClick={() => {
              restart()
              go('/')
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13.5px] font-semibold text-ink2 transition-colors duration-150 ease-std hover:bg-fill"
          >
            <Icon name="restart" size={15} className="mx-1.5" />
            Restart the demo
          </button>
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-label={`${me.name}, ${me.role}. Switch role`}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-left transition-colors duration-150 ease-std hover:bg-white/[.07] focus-visible:outline-white"
      >
        <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-full bg-white/[.16] text-[12px] font-bold">
          {me.initials}
        </span>
        <span className="min-w-0 flex-1">
          <b className="block text-[13.5px] font-semibold">{me.name}</b>
          <span className="block text-[12.5px] text-side-mut">{me.role}</span>
        </span>
        <Icon name="chevronDown" size={14} className={cx('text-side-mut', !open && 'rotate-180')} />
      </button>
    </div>
  )
}

export function Sidebar() {
  const { pathname } = useLocation()
  const { visibleRuns } = useDemo()
  const isProfessor = pathname.startsWith('/professor')
  const at = (path: string) => (path === '/' ? pathname === '/' : pathname.startsWith(path))

  return (
    <aside className="sticky top-0 flex h-[var(--app-h)] flex-col bg-side px-3 pb-4 pt-5 text-side-ink">
      <Link
        to={isProfessor ? '/professor/assignment' : '/'}
        className="flex items-center gap-2.5 rounded-md px-2 pb-[18px] focus-visible:outline-white"
      >
        <Logo light />
        <b className="font-serif text-[18px] font-semibold tracking-[.005em]">MarketMind Lab</b>
      </Link>

      <div className="mb-3.5 flex items-center justify-between rounded-lg border border-white/[.16] p-2.5">
        <div>
          <b className="block text-[13.5px] font-semibold">{course.name}</b>
          <span className="text-[12.5px] text-side-mut">{course.term}</span>
        </div>
        <Icon name="chevronDown" size={15} />
      </div>

      {/* Only the navigation scrolls in a low window. The name block below stays in view. */}
      <nav aria-label="Main" className="-mx-3 min-h-0 flex-1 overflow-y-auto px-3">
        {isProfessor ? (
          <>
            <NavItem icon="home" label="Course home" />
            <NavItem icon="document" label="Assignments" to="/professor/assignment" active={at('/professor/assignment')} count={4} />
            <NavItem icon="users" label="Submissions" to="/professor/submissions" active={at('/professor/submissions')} count={42} />
            <NavItem icon="book" label="Case library" />
            <NavGroup>Module library</NavGroup>
            {modules.active.map((m) => (
              <NavItem key={m.id} icon={moduleIcons[m.id]} label={m.name} />
            ))}
          </>
        ) : (
          <>
            <NavItem icon="home" label="Course home" to="/" active={at('/')} />
            <NavGroup>Alpine Oat Co. assignment</NavGroup>
            <NavItem icon="document" label="Case brief and data" to="/case" active={at('/case')} />
            <NavItem icon="history" label="Run history" to="/runs" active={at('/runs')} count={visibleRuns.length} />
            <NavItem icon="pencil" label="Interpretation" to="/interpretation" active={at('/interpretation')} />
            <NavGroup>Module library</NavGroup>
            {modules.active.map((m) => (
              <NavItem key={m.id} icon={moduleIcons[m.id]} label={m.name} to={m.to} active={at(m.to)} />
            ))}
          </>
        )}

        <NavGroup>
          Coming soon
          <span className="ml-2 rounded-[10px] border border-white/[.22] px-[7px] text-[11.5px] font-normal">
            {modules.comingSoon.length} modules
          </span>
        </NavGroup>
        {modules.comingSoon.map((name) => (
          <span key={name} aria-disabled="true" className="block cursor-default py-1 pl-9 pr-2.5 text-[13px] text-side-mut">
            {name}
          </span>
        ))}
      </nav>

      <UserMenu isProfessor={isProfessor} />
    </aside>
  )
}

// ---------------------------------------------------------------- top bar and page

type PageVariant = 'home' | 'student' | 'professor'

function TopBar({ crumbs, variant, mode }: { crumbs: string[]; variant: PageVariant; mode: Mode }) {
  const { notInDemo, savedAt } = useDemo()
  return (
    <header className="sticky top-0 z-20 flex h-14 flex-none items-center gap-3.5 border-b border-line bg-white px-8">
      <div className="flex items-center gap-1.5 text-[13.5px] text-ink3">
        {crumbs.map((crumb, i) =>
          i === crumbs.length - 1 ? (
            <b key={i} className="font-semibold text-ink">
              {crumb}
            </b>
          ) : (
            <span key={i} className="flex items-center gap-1.5">
              {crumb} <Icon name="chevronRight" size={13} />
            </span>
          ),
        )}
      </div>
      <span className="flex-1" />
      {variant === 'student' && (
        <>
          <span className="flex items-center gap-[5px] text-[12.5px] text-ink3">
            <Icon name="check" size={14} />
            Saved {savedAt}
          </span>
          <span data-tip={`Set by ${professor.shortName} for this assignment. You cannot change it.`} tabIndex={0}>
            <ModeChip mode={mode} prefix="AI tutor: " />
          </span>
        </>
      )}
      {variant === 'professor' && <Tag tone="primary">Professor view</Tag>}
      <button
        type="button"
        aria-label="Help"
        onClick={() => notInDemo()}
        className="inline-flex h-[30px] items-center rounded-md px-2.5 text-primary transition-colors duration-150 ease-std hover:bg-primary-t"
      >
        <Icon name="help" size={17} />
      </button>
    </header>
  )
}

/**
 * Frame of one screen: top bar plus content. With "aside" the content shares
 * the row with a fixed side panel (the AI tutor).
 */
export function Page({
  crumbs,
  variant = 'student',
  mode = 'coach',
  aside,
  children,
}: {
  crumbs: string[]
  variant?: PageVariant
  /** AI mode shown in the top bar chip. */
  mode?: Mode
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <>
      <TopBar crumbs={crumbs} variant={variant} mode={mode} />
      {aside ? (
        <div className="grid flex-1 grid-cols-[minmax(0,1fr)_468px]">
          <div className="min-w-0 px-8 pb-11 pt-7">{children}</div>
          {aside}
        </div>
      ) : (
        <div className="w-full max-w-[1192px] flex-1 px-8 pb-11 pt-7">{children}</div>
      )}
    </>
  )
}

/** Small grey line above a page title. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[13px] text-ink3">{children}</p>
}
