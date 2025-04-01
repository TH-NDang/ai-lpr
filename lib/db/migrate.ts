import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { drizzle } from 'drizzle-orm/postgres-js'
import path from 'node:path'
import postgres from 'postgres'
import { promises as fs } from 'node:fs'
import { config } from 'dotenv'

config({
  path: '.env',
})

const runMigrate = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined')
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 })
  const db = drizzle(connection)

  console.log('⏳ Running migrations...')

  const start = Date.now()
  await migrate(db, { migrationsFolder: './lib/db/migrations' })
  const end = Date.now()

  console.log('✅ Migrations completed in', end - start, 'ms')

  // Ensure license_plates table exists before running custom migrations
  try {
    const customMigrations = path.join(process.cwd(), 'lib/db/migrations')
    const migrationFiles = await fs.readdir(customMigrations)

    // Find and execute license-plates extended migration
    const extendedMigration = migrationFiles.find((file) =>
      file.includes('license-plates-extended'),
    )

    if (extendedMigration) {
      console.log('⏳ Running extended license plates migration...')
      const sqlContent = await fs.readFile(
        path.join(customMigrations, extendedMigration),
        'utf-8',
      )
      await connection.unsafe(sqlContent)
      console.log('✅ Extended migration applied successfully')
    }
  } catch (error) {
    console.error('Error running custom migrations:', error)
  }

  process.exit(0)
}

runMigrate().catch((err) => {
  console.error('❌ Migration failed')
  console.error(err)
  process.exit(1)
})
