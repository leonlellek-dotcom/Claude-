import { db } from "@/lib/db";

export async function getProductBalance(productId: string): Promise<number> {
  const movements = await db.stockMovement.findMany({
    where: { productId },
    select: { type: true, qty: true },
  });
  return movements.reduce((acc, m) => {
    const sign = m.type === "RECEIPT" || m.type === "ADJUSTMENT" ? 1 : -1;
    return acc + sign * m.qty;
  }, 0);
}

export async function getAllProductsWithBalance() {
  const products = await db.product.findMany({
    include: {
      movements: { select: { type: true, qty: true } },
      supplier: { select: { name: true } },
    },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
  return products.map((p) => {
    const balance = p.movements.reduce((acc, m) => {
      const sign = m.type === "RECEIPT" || m.type === "ADJUSTMENT" ? 1 : -1;
      return acc + sign * m.qty;
    }, 0);
    return { ...p, balance, lowStock: balance <= p.minStock };
  });
}
