export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  quantityOnHand: number;
  lowStockThreshold?: number;
  supplier?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LowStockAlert {
  id: string;
  productId: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  emailSent: boolean;
  createdAt: string;
}
