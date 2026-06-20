import type { Tool } from './types'
import HelloWorld from './hello-world'
import StringTable from './string-table'
import StringConverter from './string-converter'
import EncodeDecode from './encode-decode'

export const tools: Tool[] = [
  HelloWorld,
  StringTable,
  StringConverter,
  EncodeDecode,
]
