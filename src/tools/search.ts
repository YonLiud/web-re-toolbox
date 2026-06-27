import Fuse from 'fuse.js'
import { toolGroups } from './registry'
import type { Tool } from './types'

export interface SearchDoc {
  tool: Tool
  group: string
  aliases: string[]
}

export const SEARCH_ALIASES: Record<string, string[]> = {
  'jwt-decoder': ['jwt', 'token', 'bearer', 'claims', 'auth', 'json web token'],
  'encode-decode': ['base64', 'urlencode', 'urldecode', 'percent encode', 'decode', 'encode'],
  'hex-calculator': ['hex', 'bytes', 'ascii', 'utf8', 'utf-8', 'decimal', 'binary', 'byte inspector'],
  'hex-viewer': ['hexdump', 'hex dump', 'offset', 'ascii panel', 'binary view'],
  'buffer-overflow': ['bo', 'bof', 'overflow', 'eip', 'rip', 'offset', 'cyclic', 'pattern', 'shellcode', 'nop'],
  'reverse-shell': ['rev shell', 'revshell', 'listener', 'netcat', 'nc', 'payload'],
  'shell-upgrade': ['tty', 'pty', 'stty', 'interactive shell', 'upgrade shell', 'rlwrap', 'socat'],
  'ip-subnet': ['cidr', 'subnet', 'mask', 'netmask', 'network', 'broadcast', 'hosts'],
  'http-request': ['curl', 'raw http', 'headers', 'request', 'method', 'body'],
  'xss-encoder': ['xss', 'waf', 'bypass', 'html encode', 'javascript', 'payload'],
  'path-traversal': ['lfi', 'rfi', 'directory traversal', 'dot dot slash', 'etc passwd'],
  sqli: ['sql', 'sql injection', 'union', 'blind', 'time based', 'database'],
  'hash-calculator': ['sha', 'sha256', 'sha1', 'digest', 'crypto hash'],
  'hash-identifier': ['identify hash', 'md5', 'ntlm', 'bcrypt', 'argon2'],
  'xor-calculator': ['xor', 'single byte', 'bruteforce', 'brute force', 'key'],
  'number-base': ['base convert', 'decimal', 'hexadecimal', 'octal', 'binary'],
  'bitwise-calculator': ['and', 'or', 'not', 'shift', 'bits', 'bit operations'],
  'regex-tester': ['regex', 'regexp', 'regular expression', 'pattern match'],
  'unix-permissions': ['chmod', 'permissions', 'suid', 'sgid', 'sticky', 'octal'],
  'string-converter': ['unicode', 'codepoint', 'utf16', 'utf32', 'escape'],
  'string-table': ['index string', 'character index', 'chars', 'positions'],
  'csp-analyzer': ['content security policy', 'csp', 'headers', 'script src', 'unsafe inline'],
}

export const searchDocs: SearchDoc[] = toolGroups.flatMap(group =>
  group.tools.map(tool => ({
    tool,
    group: group.name,
    aliases: SEARCH_ALIASES[tool.meta.slug] ?? [],
  }))
)

export const toolSearch = new Fuse(searchDocs, {
  threshold: 0.38,
  ignoreLocation: true,
  minMatchCharLength: 2,
  keys: [
    { name: 'tool.meta.name', weight: 0.45 },
    { name: 'aliases', weight: 0.28 },
    { name: 'tool.meta.tags', weight: 0.14 },
    { name: 'group', weight: 0.08 },
    { name: 'tool.meta.description', weight: 0.05 },
  ],
})

export function searchTools(query: string): SearchDoc[] {
  const q = query.trim()
  if (!q) return searchDocs
  return toolSearch.search(q).map(result => result.item)
}
