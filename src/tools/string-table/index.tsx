import { useState } from 'react'
import { Table, ArrowsHorizontal, ArrowsVertical } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import type { Tool } from '../types'

function StringTable() {
  const [input, setInput] = useState('')
  const [horizontal, setHorizontal] = useState(false)

  const chars = input.split('')

  const renderChar = (char: string) =>
    char === ' ' ? <span className="text-vs-muted">·</span> : char

  return (
    <ToolLayout title="String to Table" description="Visualize each character and its index">
      <div className="flex flex-col gap-4">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a string..."
          className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-sm px-3 py-2 rounded outline-none focus:border-vs-accent transition-colors"
        />

        {chars.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-vs-muted text-xs">{chars.length} characters</span>
              <button
                onClick={() => setHorizontal(h => !h)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-vs-border bg-vs-sidebar text-vs-muted hover:text-vs-text hover:bg-vs-hover rounded transition-colors"
              >
                {horizontal ? <ArrowsVertical size={13} /> : <ArrowsHorizontal size={13} />}
                {horizontal ? 'Vertical' : 'Horizontal'}
              </button>
            </div>

            <div className="overflow-x-auto">
              {horizontal ? (
                <table className="text-sm border-collapse">
                  <tbody>
                    <tr>
                      <th className="text-vs-muted font-medium text-left px-3 py-1.5 border border-vs-border bg-vs-sidebar">Index</th>
                      {chars.map((_, i) => (
                        <td key={i} className="text-vs-muted px-3 py-1.5 border border-vs-border font-mono text-center bg-vs-sidebar">{i}</td>
                      ))}
                    </tr>
                    <tr>
                      <th className="text-vs-muted font-medium text-left px-3 py-1.5 border border-vs-border bg-vs-sidebar">Char</th>
                      {chars.map((char, i) => (
                        <td key={i} className="text-vs-text px-3 py-1.5 border border-vs-border font-mono text-center hover:bg-vs-hover transition-colors">{renderChar(char)}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table className="text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="text-vs-muted font-medium text-left px-3 py-1.5 border border-vs-border bg-vs-sidebar">Index</th>
                      <th className="text-vs-muted font-medium text-left px-3 py-1.5 border border-vs-border bg-vs-sidebar">Char</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chars.map((char, i) => (
                      <tr key={i} className="hover:bg-vs-hover transition-colors">
                        <td className="text-vs-muted px-3 py-1 border border-vs-border font-mono">{i}</td>
                        <td className="text-vs-text px-3 py-1 border border-vs-border font-mono">{renderChar(char)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  )
}

export default {
  meta: {
    slug: 'string-table',
    name: 'String to Table',
    description: 'Visualize each character and its index',
    icon: Table,
  },
  Component: StringTable,
} satisfies Tool
