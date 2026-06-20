import { Terminal } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import type { Tool } from '../types'

function HelloWorld() {
  return (
    <ToolLayout title="Hello World" description="Your first tool">
      <div className="flex items-center justify-center h-64">
        <p className="text-vs-text text-xl">Hello, World!</p>
      </div>
    </ToolLayout>
  )
}

export default {
  meta: {
    slug: 'hello-world',
    name: 'Hello World',
    description: 'Your first tool',
    icon: Terminal,
  },
  Component: HelloWorld,
} satisfies Tool
