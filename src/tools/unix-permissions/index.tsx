import { useState } from 'react'
import { Lock } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import type { Tool } from '../types'

type PermSet = { r: boolean; w: boolean; x: boolean }
type Special = { suid: boolean; sgid: boolean; sticky: boolean }
type Perms = { owner: PermSet; group: PermSet; other: PermSet }

function toOctet(p: PermSet): number {
  return (p.r ? 4 : 0) + (p.w ? 2 : 0) + (p.x ? 1 : 0)
}

function toSpecialOctet(s: Special): number {
  return (s.suid ? 4 : 0) + (s.sgid ? 2 : 0) + (s.sticky ? 1 : 0)
}

function fromOctet(n: number): PermSet {
  return { r: !!(n & 4), w: !!(n & 2), x: !!(n & 1) }
}

function fromSpecialOctet(n: number): Special {
  return { suid: !!(n & 4), sgid: !!(n & 2), sticky: !!(n & 1) }
}

function toSymbolic(perms: Perms, special: Special): string {
  const o = perms.owner
  const g = perms.group
  const t = perms.other
  const ownerX = o.x ? (special.suid ? 's' : 'x') : (special.suid ? 'S' : '-')
  const groupX = g.x ? (special.sgid ? 's' : 'x') : (special.sgid ? 'S' : '-')
  const otherX = t.x ? (special.sticky ? 't' : 'x') : (special.sticky ? 'T' : '-')
  return `-${o.r?'r':'-'}${o.w?'w':'-'}${ownerX}${g.r?'r':'-'}${g.w?'w':'-'}${groupX}${t.r?'r':'-'}${t.w?'w':'-'}${otherX}`
}

function fromOctal(s: string): { perms: Perms; special: Special } | null {
  if (!/^[0-7]{3,4}$/.test(s)) return null
  const has4 = s.length === 4
  const special = has4 ? fromSpecialOctet(parseInt(s[0])) : { suid: false, sgid: false, sticky: false }
  const digits = has4 ? s.slice(1) : s
  return {
    special,
    perms: {
      owner: fromOctet(parseInt(digits[0])),
      group: fromOctet(parseInt(digits[1])),
      other: fromOctet(parseInt(digits[2])),
    },
  }
}

function Btn({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      onClick={onChange}
      className={`w-8 h-8 text-xs font-mono rounded border transition-colors ${
        checked
          ? 'bg-vs-active border-vs-accent text-vs-text'
          : 'bg-vs-sidebar border-vs-border text-vs-muted hover:bg-vs-hover'
      }`}
    >
      {label}
    </button>
  )
}

function UnixPermissions() {
  const [perms, setPerms] = useState<Perms>({
    owner: { r: true, w: true, x: false },
    group: { r: true, w: false, x: false },
    other: { r: true, w: false, x: false },
  })
  const [special, setSpecial] = useState<Special>({ suid: false, sgid: false, sticky: false })
  const [octalInput, setOctalInput] = useState('')
  const [octalError, setOctalError] = useState(false)

  const togglePerm = (who: keyof Perms, bit: keyof PermSet) => {
    setPerms(p => ({ ...p, [who]: { ...p[who], [bit]: !p[who][bit] } }))
    setOctalInput('')
  }

  const toggleSpecial = (bit: keyof Special) => {
    setSpecial(s => ({ ...s, [bit]: !s[bit] }))
    setOctalInput('')
  }

  const handleOctalChange = (val: string) => {
    setOctalInput(val)
    if (!val) { setOctalError(false); return }
    const parsed = fromOctal(val)
    if (parsed) { setPerms(parsed.perms); setSpecial(parsed.special); setOctalError(false) }
    else setOctalError(true)
  }

  const specialOctet = toSpecialOctet(special)
  const octal = `${specialOctet > 0 ? specialOctet : ''}${toOctet(perms.owner)}${toOctet(perms.group)}${toOctet(perms.other)}`
  const symbolic = toSymbolic(perms, special)

  const ROWS: { key: keyof Perms; label: string }[] = [
    { key: 'owner', label: 'Owner' },
    { key: 'group', label: 'Group' },
    { key: 'other', label: 'Other' },
  ]

  return (
    <ToolLayout title="Unix Permissions" description="Calculate and visualize Unix file permission bits">
      <div className="flex flex-col gap-6 max-w-sm">

        {/* Special bits */}
        <div className="flex flex-col gap-2">
          <span className="text-vs-muted text-xs uppercase tracking-widest">Special bits</span>
          <div className="flex gap-3">
            {([['suid', 'SUID'], ['sgid', 'SGID'], ['sticky', 'Sticky']] as [keyof Special, string][]).map(([bit, label]) => (
              <button
                key={bit}
                onClick={() => toggleSpecial(bit)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors ${
                  special[bit]
                    ? 'bg-vs-active border-vs-accent text-vs-text'
                    : 'bg-vs-sidebar border-vs-border text-vs-muted hover:bg-vs-hover hover:text-vs-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {special.suid && <p className="text-vs-muted text-xs pl-1">SUID: runs as file owner. Common on system binaries like <span className="font-mono">passwd</span>, <span className="font-mono">sudo</span>.</p>}
          {special.sgid && <p className="text-vs-muted text-xs pl-1">SGID: runs as file group, or on directories inherits group ownership.</p>}
          {special.sticky && <p className="text-vs-muted text-xs pl-1">Sticky: only file owner can delete it in shared dirs like <span className="font-mono">/tmp</span>.</p>}
        </div>

        {/* Permission grid */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 pl-20">
            {['r', 'w', 'x'].map(l => (
              <div key={l} className="w-8 text-center text-vs-muted text-xs uppercase">{l}</div>
            ))}
            <div className="w-8 text-center text-vs-muted text-xs">oct</div>
          </div>
          {ROWS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-20 text-vs-text text-sm">{label}</span>
              {(['r', 'w', 'x'] as (keyof PermSet)[]).map(bit => (
                <Btn key={bit} label={bit} checked={perms[key][bit]} onChange={() => togglePerm(key, bit)} />
              ))}
              <div className="w-8 text-center text-vs-muted text-sm font-mono">{toOctet(perms[key])}</div>
            </div>
          ))}
        </div>

        {/* Outputs */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-vs-muted text-xs w-20">Octal</span>
            <input
              type="text"
              value={octalInput || octal}
              onChange={e => handleOctalChange(e.target.value)}
              placeholder="e.g. 644 or 4755"
              className={`flex-1 bg-vs-sidebar border text-vs-text text-sm font-mono px-3 py-1.5 rounded outline-none transition-colors ${
                octalError ? 'border-red-500' : 'border-vs-border focus:border-vs-accent'
              }`}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-vs-muted text-xs w-20">Symbolic</span>
            <span className="text-vs-text text-sm font-mono px-3 py-1.5 bg-vs-sidebar border border-vs-border rounded select-all flex-1">{symbolic}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-vs-muted text-xs w-20">chmod</span>
            <span className="text-vs-text text-sm font-mono px-3 py-1.5 bg-vs-sidebar border border-vs-border rounded select-all flex-1">chmod {octal} &lt;file&gt;</span>
          </div>
        </div>

      </div>
    </ToolLayout>
  )
}

export default {
  meta: {
    slug: 'unix-permissions',
    name: 'Unix Permissions',
    description: 'Calculate and visualize Unix file permission bits',
    icon: Lock,
    tags: ['linux', 'util'],
  },
  Component: UnixPermissions,
} satisfies Tool
