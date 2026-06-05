import { execSync } from 'node:child_process'
import { existsSync, unlinkSync } from 'node:fs'

const out = 'f:/bozone/deploy.tar.gz'
if (existsSync(out)) unlinkSync(out)

// Use tar to avoid locked file issues, exclude node_modules
execSync(
  `tar -czf "${out}" --exclude=node_modules --exclude=data --exclude=logs --exclude=dist --exclude=.git -C f:/bozone server client ecosystem.config.cjs`,
  { stdio: 'inherit', cwd: 'f:/bozone' }
)

console.log('Created:', out)
