import { useState, useMemo } from 'react'
import { NetworkSlash } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import type { Tool } from '../types'

function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number)
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
}

function intToIp(n: number): string {
  return [24, 16, 8, 0].map(s => (n >>> s) & 0xff).join('.')
}

function intToBin(n: number): string {
  return n.toString(2).padStart(32, '0').match(/.{8}/g)!.join('.')
}

function ipClass(ip: number): string {
  const first = ip >>> 24
  if (first < 128) return 'A'
  if (first < 192) return 'B'
  if (first < 224) return 'C'
  if (first < 240) return 'D (Multicast)'
  return 'E (Reserved)'
}

function isPrivate(ip: number): boolean {
  const a = ip >>> 24
  const b = (ip >>> 16) & 0xff
  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 127)
  )
}

function calculate(cidr: string) {
  const match = cidr.trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})(?:\/(\d{1,2}))?$/)
  if (!match) return null

  const ipStr = match[1]
  const prefix = match[2] !== undefined ? parseInt(match[2]) : 32

  const parts = ipStr.split('.').map(Number)
  if (parts.some(p => p > 255) || prefix > 32) return null

  const ip      = ipToInt(ipStr)
  const mask    = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  const network = (ip & mask) >>> 0
  const bcast   = (network | (~mask >>> 0)) >>> 0
  const hosts   = prefix >= 31 ? Math.pow(2, 32 - prefix) : Math.pow(2, 32 - prefix) - 2
  const first   = prefix >= 31 ? network : network + 1
  const last    = prefix >= 31 ? bcast   : bcast - 1

  return { ip, mask, network, bcast, first, last, hosts, prefix, ipStr }
}

function Row({ label, value, mono = true, sub }: { label: string; value: string; mono?: boolean; sub?: string }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-vs-border last:border-0 gap-4">
      <div className="flex flex-col">
        <span className="text-vs-muted text-xs">{label}</span>
        {sub && <span className="text-vs-muted text-xs font-mono mt-0.5">{sub}</span>}
      </div>
      <span className={`text-vs-text text-sm text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

function IPSubnet() {
  const [input, setInput] = useState('')

  const result = useMemo(() => input.trim() ? calculate(input) : null, [input])
  const invalid = input.trim() && result === null

  return (
    <ToolLayout title="IP Subnet Calculator" description="Calculate network ranges, masks, and host counts from CIDR notation">
      <div className="flex flex-col gap-5 max-w-lg">

        <p className="text-vs-muted text-xs border-l-2 border-vs-border pl-3 leading-relaxed">
          Enter an IP address with optional CIDR prefix, e.g. <span className="font-mono text-vs-text">192.168.1.1/24</span> or <span className="font-mono text-vs-text">10.0.0.1</span>.
        </p>

        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="192.168.1.1/24"
          spellCheck={false}
          className={`w-full bg-vs-sidebar border text-vs-text text-sm font-mono px-3 py-2 rounded outline-none transition-colors ${
            invalid ? 'border-red-500' : 'border-vs-border focus:border-vs-accent'
          }`}
        />
        {invalid && <p className="text-red-500 text-xs -mt-3">Invalid IP or CIDR notation.</p>}

        {result && (
          <div className="flex flex-col gap-4">

            {/* Tags */}
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 rounded border border-vs-border text-vs-muted">
                Class {ipClass(result.ip)}
              </span>
              <span className={`text-xs px-2 py-1 rounded border ${
                isPrivate(result.ip)
                  ? 'border-vs-border text-vs-muted'
                  : 'border-yellow-500 text-yellow-500'
              }`}>
                {isPrivate(result.ip) ? 'Private' : 'Public'}
              </span>
              <span className="text-xs px-2 py-1 rounded border border-vs-border text-vs-muted">
                /{result.prefix}
              </span>
            </div>

            <div className="bg-vs-sidebar border border-vs-border rounded px-3">
              <Row label="IP Address"       value={intToIp(result.ip)}       sub={intToBin(result.ip)} />
              <Row label="Subnet Mask"      value={intToIp(result.mask)}     sub={intToBin(result.mask)} />
              <Row label="Wildcard Mask"    value={intToIp(~result.mask >>> 0)} />
              <Row label="Network Address"  value={intToIp(result.network)}  />
              <Row label="Broadcast"        value={intToIp(result.bcast)}    />
              <Row label="First Host"       value={intToIp(result.first)}    />
              <Row label="Last Host"        value={intToIp(result.last)}     />
              <Row label="Usable Hosts"     value={result.hosts.toLocaleString()} />
            </div>

          </div>
        )}
      </div>
    </ToolLayout>
  )
}

export default {
  meta: {
    slug: 'ip-subnet',
    name: 'IP Subnet',
    description: 'Calculate network ranges, masks, and host counts from CIDR',
    icon: NetworkSlash,
  },
  Component: IPSubnet,
} satisfies Tool
