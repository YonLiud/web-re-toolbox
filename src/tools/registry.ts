import type { Tool } from './types'
import HelloWorld from './hello-world'
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

export const tools: Tool[] = [
  HelloWorld,
  StringTable,
  StringConverter,
  EncodeDecode,
  NumberBase,
  HashIdentifier,
  HashCalculator,
  UnixPermissions,
  JWTDecoder,
  XORCalculator,
  IPSubnet,
  BitwiseCalculator,
  RegexTester,
  HexViewer,
]
