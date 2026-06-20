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
import CSPAnalyzer from './csp-analyzer'
import SQLi from './sqli'

export const tools: Tool[] = [
  // Web Pentest
  SQLi,
  XSSEncoder,
  PathTraversal,
  HttpRequest,
  CSPAnalyzer,
  JWTDecoder,
  // Encoding / Crypto
  EncodeDecode,
  HashCalculator,
  HashIdentifier,
  XORCalculator,
  NumberBase,
  // Reverse Engineering
  HexViewer,
  StringTable,
  StringConverter,
  BitwiseCalculator,
  // Network / System
  IPSubnet,
  UnixPermissions,
  RegexTester,
]
