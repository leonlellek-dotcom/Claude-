import { db } from "@/lib/db";

type AuditInput = {
  userId?: string | null;
  entity: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  before?: unknown;
  after?: unknown;
};

export async function audit(input: AuditInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: input.userId ?? null,
        entity: input.entity,
        entityId: input.entityId,
        action: input.action,
        before: input.before == null ? null : JSON.stringify(input.before),
        after: input.after == null ? null : JSON.stringify(input.after),
      },
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}
