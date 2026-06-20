import type { Tool } from './types'
import HelloWorld from './hello-world'
import StringTable from './string-table'
import StringConverter from './string-converter'
import EncodeDecode from './encode-decode'
import NumberBase from './number-base'
import HashIdentifier from './hash-identifier'
import UnixPermissions from './unix-permissions'

export const tools: Tool[] = [
  HelloWorld,
  StringTable,
  StringConverter,
  EncodeDecode,
  NumberBase,
  HashIdentifier,
  UnixPermissions,
]
