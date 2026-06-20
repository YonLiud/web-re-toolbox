# web-re-toolbox

A browser-based toolbox for penetration testers and reverse engineers — encoding, hashing, hex viewing, XSS/SQLi payload generation, CSP analysis, and more. No backend, no telemetry, everything runs in your browser.

**Live at [yonliud.dev/toolbox](https://yonliud.dev/toolbox)**

---

## Stack

- React 19 + TypeScript + Vite 8
- Tailwind CSS v4
- Phosphor Icons
- React Router v7

---

## Contributing a Tool

Want to add a tool? Open a PR — contributions are welcome.

### 1. Create your tool file

Create `src/tools/<your-tool-name>/index.tsx`. Each tool exports a default object that satisfies the `Tool` type:

```tsx
import { YourIcon } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import type { Tool } from '../types'

function YourTool() {
  return (
    <ToolLayout title="Your Tool" description="One-line description">
      {/* your UI here */}
    </ToolLayout>
  )
}

export default {
  meta: {
    slug: 'your-tool',           // unique kebab-case slug → becomes the URL path
    name: 'Your Tool',           // display name in sidebar and home grid
    description: 'One-line description',
    icon: YourIcon,              // any icon from @phosphor-icons/react
    tags: ['web', 'encoding'],   // pick from existing tags or add new ones
  },
  Component: YourTool,
} satisfies Tool
```

### 2. Register it

Open `src/tools/registry.ts`, import your tool, and add it to the `tools` array in the appropriate group:

```ts
import YourTool from './your-tool'

export const tools: Tool[] = [
  // Web Pentest
  SQLi, XSSEncoder, PathTraversal, HttpRequest, CSPAnalyzer, JWTDecoder,
  // Encoding / Crypto
  EncodeDecode, HashCalculator, HashIdentifier, XORCalculator, NumberBase,
  // Reverse Engineering
  HexViewer, StringTable, StringConverter, BitwiseCalculator,
  // Network / System
  IPSubnet, UnixPermissions, RegexTester,
  // your new tool goes here in the right group
  YourTool,
  // Misc
  HelloWorld,
]
```

### 3. Available tags

Use one or more of these existing tags in your tool's `tags` array, or add a new one if nothing fits:

| Tag | Used for |
|-----|----------|
| `web` | Anything web-related |
| `pentest` | Offensive security / pentesting |
| `encoding` | Encoding and decoding transformations |
| `crypto` | Cryptographic operations |
| `re` | Reverse engineering |
| `binary` | Bit-level / hex / binary work |
| `network` | Networking tools |
| `auth` | Authentication-related |
| `bypass` | WAF / filter bypass techniques |
| `hash` | Hashing |
| `linux` | Linux-specific |
| `util` | General utility |

### 4. UI conventions

- **VSCode theme variables** — use `text-vs-text`, `text-vs-muted`, `bg-vs-sidebar`, `bg-vs-bg`, `bg-vs-active`, `bg-vs-hover`, `border-vs-border`, `text-vs-accent` for colors. Don't hardcode dark/light values.
- **`ToolLayout`** — always wrap your component in `<ToolLayout title="..." description="...">`.
- **Toggle patterns** — for filter/bypass tools, use the toggle-category pattern from `xss-encoder` or `path-traversal` as a reference.
- **Copy buttons** — use `navigator.clipboard.writeText` with a `Check` icon flash (see any existing tool).
- **No backend** — all logic must run in the browser. Web Crypto API, TextEncoder, and `atob`/`btoa` are all available.

### 5. Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

### 6. Open the PR

- Commit as `feat: <tool name>` (one tool per commit keeps history clean)
- Open a PR against `main`
- The title should be `feat: <Tool Name>`

---

## Existing Tools

| Tool | Tags |
|------|------|
| SQL Injection | `web` `pentest` `bypass` |
| XSS / WAF Bypass | `web` `pentest` `bypass` `encoding` |
| Path Traversal | `web` `pentest` `bypass` `encoding` |
| HTTP Request Builder | `web` `pentest` |
| CSP Analyzer | `web` `pentest` |
| JWT Decoder | `web` `auth` `encoding` |
| Encode / Decode | `encoding` |
| Hash Calculator | `crypto` `hash` |
| Hash Identifier | `crypto` `hash` |
| XOR Calculator | `crypto` `binary` |
| Number Base | `encoding` `binary` |
| Hex Viewer | `re` `binary` |
| String to Table | `re` `encoding` |
| Unicode Converter | `encoding` `re` |
| Bitwise Calculator | `binary` `re` |
| IP Subnet | `network` `pentest` |
| Unix Permissions | `linux` `util` |
| Regex Tester | `util` |

---

## License

MIT
