import { SupplyItemStatus } from "@prisma/client";

export interface SupplyItemSerialized {
  id: string;
  name: string;
  category: string | null;
  quantityNeeded: number;
  quantityOwned: number;
  quantityRemaining: number;
  estimatedCost: number | null;
  actualCost: number | null;
  status: SupplyItemStatus;
  whoBrings: { id: string; name: string; avatarUrl: string | null } | null;
  whoBought: { id: string; name: string; avatarUrl: string | null } | null;
  whoBringsId: string | null;
  notes: string | null;
}
