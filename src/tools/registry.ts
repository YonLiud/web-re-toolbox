import type { Tool } from './types'
import StringTable from './string-table'
import StringConverter from './string-converter'
import EncodeDecode from './encode-decode'
import NumberBase from './number-base'
import HashIdentifier from './hash-identifier'
import HashCalculator from './hash-calculator'
import UnixPermissions from './unix-permissions'
import JWTDecoder from './jwt-decoder'
import XORCalculator from './xor-calculator'
import IPSubnet from './ip-subnet'
import BitwiseCalculator from './bitwise-calculator'
import RegexTester from './regex-tester'
import HexViewer from './hex-viewer'
import PathTraversal from './path-traversal'
import XSSEncoder from './xss-encoder'
import HttpRequest from './http-request'
import SQLi from './sqli'
import ShellUpgrade from './shell-upgrade'
import ReverseShell from './reverse-shell'

export interface ToolGroup {
  name: string
  tools: Tool[]
}

export const toolGroups: ToolGroup[] = [
  {
    name: 'Web & Pentest',
    tools: [SQLi, XSSEncoder, PathTraversal, HttpRequest, JWTDecoder],
  },
  {
    name: 'Encoding & Crypto',
    tools: [EncodeDecode, HashCalculator, HashIdentifier, XORCalculator, NumberBase],
  },
  {
    name: 'Reverse Engineering',
    tools: [HexViewer, StringTable, StringConverter, BitwiseCalculator],
  },
  {
    name: 'Shells & Network',
    tools: [ReverseShell, ShellUpgrade, IPSubnet, UnixPermissions, RegexTester],
  },
]

export const tools: Tool[] = toolGroups.flatMap(g => g.tools)
