/**
 * Secure admin password reset CLI.
 *
 * Use this when an admin loses their password and the one-time login banner is
 * no longer available. The script never prints any pre-existing password from
 * the database (only the bcrypt hash lives there) and never touches application
 * data — it only updates the `password` and `must_change_password` columns on
 * a single user row.
 *
 * Run from the project root:
 *
 *   # Reset the default `admin` user with a freshly generated strong password.
 *   # The plaintext is printed ONCE in the terminal — copy it immediately.
 *   npx tsx script/reset-admin-password.ts
 *
 *   # Reset a specific user.
 *   npx tsx script/reset-admin-password.ts --user=other_admin
 *
 *   # Reset using a password you choose (must be 8+ chars).
 *   npx tsx script/reset-admin-password.ts --password='My$tr0ng!Pass'
 *   ADMIN_RESET_PASSWORD='My$tr0ng!Pass' npx tsx script/reset-admin-password.ts
 *
 * Production safety:
 *   When NODE_ENV=production, the script refuses to run unless you also pass
 *   CONFIRM=yes in the environment. This prevents an accidental reset against
 *   the live database.
 *
 *   CONFIRM=yes NODE_ENV=production npx tsx script/reset-admin-password.ts
 *
 * The target user is always marked `mustChangePassword=true`, so the chosen
 * value is treated as a one-time temporary credential and the user is forced
 * to pick a new one on their next login.
 */

import "dotenv/config";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../server/db";
import { users } from "../shared/schema";

interface CliOptions {
  username: string;
  providedPassword: string | null;
}

function parseArgs(argv: string[]): CliOptions {
  let username = "admin";
  let providedPassword: string | null = process.env.ADMIN_RESET_PASSWORD ?? null;

  for (const raw of argv.slice(2)) {
    if (raw === "--help" || raw === "-h") {
      printUsageAndExit(0);
    } else if (raw.startsWith("--user=")) {
      username = raw.slice("--user=".length).trim();
    } else if (raw.startsWith("--password=")) {
      providedPassword = raw.slice("--password=".length);
    } else {
      console.error(`Unknown argument: ${raw}`);
      printUsageAndExit(2);
    }
  }

  if (!username) {
    console.error("Username cannot be empty.");
    printUsageAndExit(2);
  }

  return { username, providedPassword };
}

function printUsageAndExit(code: number): never {
  console.error(
    [
      "Usage: npx tsx script/reset-admin-password.ts [--user=admin] [--password=...]",
      "",
      "  --user=USERNAME       Target username (default: admin)",
      "  --password=VALUE      Use the given password instead of generating one",
      "                        (8+ chars). Equivalent: ADMIN_RESET_PASSWORD env var.",
      "  -h, --help            Show this help.",
      "",
      "In production (NODE_ENV=production) you must also pass CONFIRM=yes.",
    ].join("\n"),
  );
  process.exit(code);
}

function generateStrongPassword(length = 24): string {
  // URL-safe alphabet with ambiguous characters removed (0/O, 1/l/I).
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

function printResult(params: {
  username: string;
  role: string;
  generated: boolean;
  password: string;
}) {
  const { username, role, generated, password } = params;
  const lines = [
    "",
    "╔══════════════════════════════════════════════════════════════╗",
    "║  Password reset successful                                   ║",
    "║  تم إعادة تعيين كلمة المرور بنجاح                              ║",
    "╠══════════════════════════════════════════════════════════════╣",
    `║  username: ${username}`.padEnd(63) + "║",
    `║  role:     ${role}`.padEnd(63) + "║",
  ];
  if (generated) {
    lines.push(
      `║  password: ${password}`.padEnd(63) + "║",
      "╠══════════════════════════════════════════════════════════════╣",
      "║  • Copy the password NOW — it will not be shown again.       ║",
      "║  • انسخ كلمة المرور الآن — لن تُعرض مرّة أخرى.                  ║",
    );
  } else {
    lines.push(
      "║  password: (the value you supplied was applied)              ║",
      "╠══════════════════════════════════════════════════════════════╣",
    );
  }
  lines.push(
    "║  • The user MUST change this password on their next login.   ║",
    "║  • سيُطلب من المستخدم تغيير كلمة المرور عند أوّل دخول.          ║",
    "╚══════════════════════════════════════════════════════════════╝",
    "",
  );
  console.log(lines.join("\n"));
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error(
      "DATABASE_URL is not set. Make sure you run this script in an environment with database access.",
    );
    process.exit(1);
  }

  const isProd = process.env.NODE_ENV === "production";
  if (isProd && process.env.CONFIRM !== "yes") {
    console.error(
      "Refusing to run in production without explicit confirmation.\n" +
        "Re-run with: CONFIRM=yes NODE_ENV=production npx tsx script/reset-admin-password.ts",
    );
    process.exit(1);
  }

  const { username, providedPassword } = parseArgs(process.argv);

  // Decide the new password.
  let newPassword: string;
  let generated = false;
  if (providedPassword !== null && providedPassword !== "") {
    if (providedPassword.length < 8) {
      console.error("Provided password must be at least 8 characters.");
      process.exit(2);
    }
    newPassword = providedPassword;
  } else {
    newPassword = generateStrongPassword(24);
    generated = true;
  }

  // Confirm the user exists BEFORE writing anything.
  const existing = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.username, username));

  if (existing.length === 0) {
    console.error(
      `User "${username}" was not found. No changes were made.\n` +
        "Tip: pass --user=<username> to target a different account.",
    );
    process.exit(1);
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  const updated = await db
    .update(users)
    .set({ password: hashed, mustChangePassword: true })
    .where(eq(users.username, username))
    .returning({
      id: users.id,
      username: users.username,
      role: users.role,
    });

  if (updated.length !== 1) {
    console.error(
      `Update did not affect exactly one row (rows=${updated.length}). Aborting.`,
    );
    process.exit(1);
  }

  printResult({
    username: updated[0].username,
    role: updated[0].role,
    generated,
    password: newPassword,
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Reset failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
