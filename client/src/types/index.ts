// File Location: client/src/types/index.ts
export type UserRole = 'admin' | 'pharmacist' | 'cashier';
export interface User {
  id: number;
  username: string;
  email: string | null;
  phone: string | null;
  role: UserRole[]; 
  status: 'active' | 'inactive' | 'locked' | 'blocked';
}

export interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
}

export interface Product {
  id: number;
  name: string;
  brand: string | null;
  category: string | null;
  description: string | null;
  requires_prescription: boolean;
  suppliers: { id: number; name: string }[];
}

export interface InventoryItem {
  id: number;
  product_id: number;
  name: string;
  brand: string | null;
  supplier_name?: string;
  requires_prescription: boolean;
  quantity_of_packages: number;
  opened_package_units: number;
  units_per_package: number | null;
  purchase_price: string | null;
  selling_price: string;
  batch_number: string | null;
  expiry_date: string;
  suppliers: { id: number; name: string }[]; 
}

export interface CartItem extends InventoryItem {
  quantityInCart: number;
  prescriptionId?: number;
}

export interface Doctor {
  id: number;
  name: string;
}

export interface PurchaseOrderItem {
  id: number;
  po_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price_per_item: string;
}

export interface PurchaseOrder {
  id: number;
  supplier_id: number | null;
  supplier_name: string | null;
  status: 'Pending' | 'Received' | 'Cancelled';
  total_items: number;
  total_quantity: number;
  total_value: string | null;
  created_by_username?: string;
  date_created: string;
}
export interface PurchaseOrderDetails extends PurchaseOrder {
  items: PurchaseOrderItem[];
}

export interface Sale {
  id: number;
  total_amount: string;
  tax_amount: string;
  sale_date: string;
  cashier_name: string;
}

export interface SaleItem {
  product_name: string;
  quantity_sold: number;
  price_at_time_of_sale: string;
}

export interface Receipt extends Sale {
  items: SaleItem[];
}


export interface ActivityLog {
  id: number;
  username: string;
  action: string;
  details: string | null;
  timestamp: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalSuppliers: number;
  lowStockItems: number;
  outOfStockItems: number;
  pendingPurchaseOrders: number;
  totalSalesValue: number;
  expiredProducts: number;
  expiringSoonProducts: number;
}

export interface PendingSale {
  id: number;
  pharmacist_name: string;
  cart_data: CartItem[];
  created_at: string;
}


export interface ProductDetails extends Product {
  inventoryBatches: InventoryItem[];
}

export interface Notification {
  id: number;
  type: 'expired' | 'expiring_soon' | 'out_of_stock' | 'low_stock';
  message: string;
  product_id: number | null;
  link: string;
  is_read: boolean;
  created_at: string;
  acknowledged_until: string | null;
}
export interface Alert {
  product_id?: number;
  type: 'expired' | 'expiring_soon' | 'out_of_stock';
  message: string;
  date: string | null;
  link?: string;
}

