// #!/usr/bin/env node

import { exec } from 'node:child_process'
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from "node:url"
import prompts from 'prompts'

async function getName(): Promise<string> {
  const { name } = await prompts({
    type: 'text',
    name: 'name',
    message: 'What is your project name?',
    initial: 'mushin-app',
  })
  if (!name) {
    console.error('Please provide a project name.')
    process.exit(1)
  }
  return name.trim()
}

async function init() {
  const cwd = process.cwd()
  const name = await getName()
  const projectDir = resolve(cwd, name)

  const existFiles = await readdir(projectDir)
  if (existFiles.length > 0) {
    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: 'The project directory is not empty. Do you want to overwrite it?',
      initial: false,
    })
    if (!overwrite) {
      process.exit(0)
    }
  }

  const __dirname = fileURLToPath(import.meta.url)
  const templateDir = resolve(__dirname, '../../template-mushin')
  const files = await readdir(templateDir)

  for (const file of files) {
    const filePath = join(templateDir, file)
    const fileStat = await stat(filePath)
    if (fileStat.isFile()) {
      const content = await readFile(filePath, 'utf-8')
      const targetFilePath = join(projectDir, file)
      await writeFile(targetFilePath, content)
    }
  }

  // Ask the user whether to run "pnpm install"
  const { install } = await prompts({
    type: 'confirm',
    name: 'install',
    message: 'Do you want to run "pnpm install" now?',
    initial: true,
  })
  if (install) {
    console.log('Installing dependencies...')
    exec('pnpm install', { cwd: projectDir }, async (error) => {
      if (error) {
        console.error('Failed to install dependencies.')
        process.exit(1)
      }
      console.log('Dependencies installed successfully.')
      // Ask the user whether to run "pnpm start"
      const { start } = await prompts({
        type: 'confirm',
        name: 'start',
        message: 'Do you want to run "pnpm start" now?',
        initial: true,
      })
      if (start) {
        console.log('Starting the application...')
        exec('pnpm start', { cwd: projectDir }, (error) => {
          if (error) {
            console.error('Failed to start the application.')
            process.exit(1)
          }
        })
      }
    })
  }
}

init().catch((error) => {
  console.error(error)
  process.exit(1)
})
