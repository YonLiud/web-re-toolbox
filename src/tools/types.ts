import type { ComponentType } from 'react'
import type { IconProps } from '@phosphor-icons/react'

export interface ToolMeta {
  slug: string
  name: string
  description: string
  icon: ComponentType<IconProps>
}

export interface Tool {
  meta: ToolMeta
  Component: ComponentType
}
