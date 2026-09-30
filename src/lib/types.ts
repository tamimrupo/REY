export type UserRole = "customer" | "staff" | "admin";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  notes: string | null;
  is_blocked: boolean;
  created_at: string;
};

export type Address = {
  id: string;
  user_id: string;
  label: string;
  recipient: string;
  phone: string;
  division: string | null;
  city: string | null;
  area: string | null;
  street: string;
  postcode: string | null;
  is_default: boolean;
};

export type Author = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
};

export type Genre = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type Book = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  author_id: string | null;
  genre_id: string | null;
  description: string | null;
  cover_url: string | null;
  language: string | null;
  isbn: string | null;
  publisher: string | null;
  published_year: number | null;
  pages: number | null;
  rarity: "common" | "rare";
  is_active: boolean;
  total_copies: number;
  created_at: string;
  // joined
  authors?: { name: string } | null;
  genres?: { name: string } | null;
};

export type Plan = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  price_monthly: number;
  books_per_month: number;
  security_deposit: number;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
};

export type PlanFeature = {
  id: string;
  plan_id: string;
  feature: string;
  sort_order: number;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: "pending" | "active" | "paused" | "cancelled" | "expired";
  started_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  next_billing_date: string | null;
  created_at: string;
  plans?: Plan | null;
  profiles?: Profile | null;
};

export type SubscriptionCycle = {
  id: string;
  subscription_id: string;
  cycle_number: number;
  period_start: string;
  period_end: string | null;
  status: string;
  notes: string | null;
  cycle_picks?: CyclePick[];
};

export type CyclePick = {
  id: string;
  cycle_id: string;
  book_id: string;
  status: string;
  books?: Book | null;
};

export type Order = {
  id: string;
  order_number: string;
  user_id: string;
  subscription_id: string | null;
  type: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  deposit_amount: number;
  discount: number;
  total: number;
  address_id: string | null;
  notes: string | null;
  created_at: string;
  profiles?: Profile | null;
  order_items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  book_id: string | null;
  label: string;
  quantity: number;
  unit_price: number;
};

export type Payment = {
  id: string;
  order_id: string | null;
  user_id: string;
  method: string;
  amount: number;
  sender_number: string | null;
  trx_id: string | null;
  screenshot_url: string | null;
  status: "pending" | "verified" | "rejected";
  verified_at: string | null;
  reject_reason: string | null;
  created_at: string;
  orders?: Order | null;
  profiles?: Profile | null;
};

export type Deposit = {
  id: string;
  user_id: string;
  subscription_id: string | null;
  amount: number;
  status: "held" | "refunded" | "forfeited";
  refunded_at: string | null;
  refund_trx_id: string | null;
  notes: string | null;
  created_at: string;
  profiles?: Profile | null;
};

export type Delivery = {
  id: string;
  order_id: string | null;
  subscription_id: string | null;
  courier: string;
  tracking_code: string | null;
  status: string;
  fee: number;
  dispatched_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  created_at: string;
};

export type RareRequest = {
  id: string;
  user_id: string | null;
  title: string;
  author: string | null;
  note: string | null;
  contact: string | null;
  status: "pending" | "sourcing" | "added" | "rejected";
  created_at: string;
  profiles?: Profile | null;
};

export type CmsPage = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  status: "draft" | "published";
  sort_order: number;
  updated_at: string;
};

export type SiteSettings = {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  facebook: string;
  instagram: string;
};

export type PaymentMethodInfo = {
  key: string;
  label: string;
  number: string;
  type: string;
};

export type DeliveryMethod = {
  key: string;
  label: string;
  fee: number;
  note: string;
};

export type PaymentSettings = {
  enabled: boolean;
  instructions: string;
  methods: PaymentMethodInfo[];
};

export type DeliverySettings = {
  methods: DeliveryMethod[];
};

export type DashboardStats = {
  active_subscriptions: number;
  pending_subscriptions: number;
  customers: number;
  pending_payments: number;
  open_requests: number;
  titles: number;
  held_deposits: number;
  mrr: number;
};

export const DEFAULT_SITE: SiteSettings = {
  name: "REY BD",
  tagline: "Choose your plan, pick your books.",
  email: "hello@reybd.com",
  phone: "+880 17921 02092",
  address: "House # 28, Road # 8/A, Nikunjo-1, Dhaka-1229",
  facebook: "",
  instagram: "",
};

export const DEFAULT_PAYMENTS: PaymentSettings = {
  enabled: true,
  instructions:
    "Send the payment to one of the numbers below, then submit the transaction ID. We verify within a few hours.",
  methods: [
    { key: "bkash", label: "bKash", number: "01792102092", type: "Personal" },
    { key: "nagad", label: "Nagad", number: "01792102092", type: "Personal" },
  ],
};

export const DEFAULT_DELIVERY: DeliverySettings = {
  methods: [
    { key: "steadfast", label: "Steadfast", fee: 40, note: "50% off" },
    { key: "pathao", label: "Pathao", fee: 40, note: "50% off" },
    { key: "redx", label: "RedX", fee: 40, note: "50% off" },
    { key: "bdpost", label: "BD Post", fee: 0, note: "Free" },
  ],
};
