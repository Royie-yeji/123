import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const DATA_DIR = join(__dirname, 'data')

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true })
}

export async function readJson(fileName, fallback) {
  await ensureDataDir()
  const filePath = join(DATA_DIR, fileName)
  try {
    const raw = await readFile(filePath, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    if (err?.code === 'ENOENT') return structuredClone(fallback)
    console.error(`[DataStore] Failed to read ${fileName}`, err)
    return structuredClone(fallback)
  }
}

export async function writeJson(fileName, data) {
  await ensureDataDir()
  const filePath = join(DATA_DIR, fileName)
  const tempPath = `${filePath}.tmp`
  await writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  await rename(tempPath, filePath)
}

export async function readAllData() {
  const [users, accounts, transactions, orders, sessions, codes] = await Promise.all([
    readJson('users.json', []),
    readJson('token-accounts.json', []),
    readJson('token-transactions.json', []),
    readJson('orders.json', []),
    readJson('sessions.json', []),
    readJson('email-codes.json', []),
  ])
  return { users, accounts, transactions, orders, sessions, codes }
}
