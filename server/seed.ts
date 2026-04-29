import { storage } from "./storage";

async function main() {
  console.log("[SEED] بدء عملية تهيئة قاعدة البيانات...");

  // The DatabaseStorage constructor schedules initializeAdmin() via void.
  // We give it time to run, then verify the admin user exists.
  await new Promise((resolve) => setTimeout(resolve, 500));

  const admin = await storage.getUserByUsername("admin");
  if (admin) {
    console.log(
      `[SEED] ✓ المستخدم admin موجود (id=${admin.id}, mustChangePassword=${admin.mustChangePassword}).`,
    );
  } else {
    console.error("[SEED] ✗ فشل في إنشاء/إيجاد مستخدم admin.");
    process.exit(1);
  }

  const users = await storage.getUsers();
  const members = await storage.getMembers();
  console.log(`[SEED] الحالة الحالية: ${users.length} مستخدم، ${members.length} عضو.`);
  console.log("[SEED] اكتملت التهيئة.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[SEED] خطأ غير متوقع:", err);
  process.exit(1);
});
