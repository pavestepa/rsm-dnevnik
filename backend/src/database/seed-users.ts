import { readFile } from 'fs/promises';
import { isAbsolute, resolve } from 'path';
import { config as loadEnv } from 'dotenv';
import AppDataSource from './data-source';

loadEnv({ path: resolve(process.cwd(), '.env') });

interface SeedUser {
  id: string;
  login: string;
  password: string;
  phone?: string | null;
}

async function seedUsers(): Promise<void> {
  const filePath = resolveUsersFilePath();
  const raw = await readFile(filePath, 'utf-8');
  const users = JSON.parse(raw) as SeedUser[];

  if (!Array.isArray(users)) {
    throw new Error('users.json must contain an array of users');
  }

  await AppDataSource.initialize();

  for (const entry of users) {
    if (!entry.id || !entry.login || !entry.password) {
      throw new Error('Each user must include id, login and password');
    }

    await AppDataSource.query(
      `
      INSERT INTO "users" ("id", "login", "passwordHash", "name", "phone", "bio", "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NULL, true, now(), now())
      ON CONFLICT ("id") DO UPDATE SET
        "login" = EXCLUDED."login",
        "passwordHash" = EXCLUDED."passwordHash",
        "name" = EXCLUDED."name",
        "phone" = EXCLUDED."phone",
        "updatedAt" = now()
      `,
      [entry.id, entry.login, entry.password, entry.login, entry.phone ?? null],
    );

    console.log(`Seeded user: ${entry.login}`);
  }

  await AppDataSource.destroy();
  console.log(`Done. Seeded ${users.length} users from ${filePath}`);
}

function resolveUsersFilePath(): string {
  const configuredPath = process.env.USERS_FILE_PATH ?? '../users.json';
  return isAbsolute(configuredPath)
    ? configuredPath
    : resolve(process.cwd(), configuredPath);
}

seedUsers().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Seed failed: ${message}`);
  process.exit(1);
});
