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
import HexCalculator from './hex-calculator'
import CSPAnalyzer from './csp-analyzer'
import PathTraversal from './path-traversal'
import XSSEncoder from './xss-encoder'
import HttpRequest from './http-request'
import SQLi from './sqli'
import ShellUpgrade from './shell-upgrade'
import ReverseShell from './reverse-shell'
import BufferOverflow from './buffer-overflow'

export interface ToolGroup {
  name: string
  tools: Tool[]
}

export const toolGroups: ToolGroup[] = [
  {
    name: 'Web',
    tools: [HttpRequest, JWTDecoder, CSPAnalyzer, SQLi, XSSEncoder, PathTraversal],
  },
  {
    name: 'Encode',
    tools: [HexCalculator, EncodeDecode, StringConverter, NumberBase, HashCalculator, HashIdentifier],
  },
  {
    name: 'Binary',
    tools: [HexViewer, XORCalculator, BitwiseCalculator, BufferOverflow, StringTable],
  },
  {
    name: 'Ops',
    tools: [ReverseShell, ShellUpgrade, IPSubnet],
  },
  {
    name: 'Utils',
    tools: [RegexTester, UnixPermissions],
  },
]

export const tools: Tool[] = toolGroups.flatMap(g => g.tools)
