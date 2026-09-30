export type UserRole = "customer" | "staff" | "admin";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  notes: string | null;
  is_blocked: boolean;
  courier_preference: string;
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
  avatar_url?: string | null;
};

export type Genre = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type Demand = "high" | "medium" | "low";

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
  demand: Demand;
  replacement_value: number;
  weight_grams: number | null;
  is_active: boolean;
  total_copies: number;
  created_at: string;
  // joined
  authors?: {
    name: string;
    slug?: string;
    avatar_url?: string | null;
    bio?: string | null;
  } | null;
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

export type SubscriptionStatus = "pending" | "active" | "paused" | "cancelled" | "expired";

export type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  started_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  next_billing_date: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  plans?: Plan | null;
  profiles?: Profile | null;
};

/* -------------------------------------------------------------------------- */
/* Rentals — one row per borrowed book                                        */
/* -------------------------------------------------------------------------- */

export type RentalStatus = "pending" | "out" | "returning" | "returned" | "lost" | "cancelled";

export type Rental = {
  id: string;
  user_id: string;
  subscription_id: string | null;
  book_id: string;
  copy_id: string | null;
  order_id: string | null;
  status: RentalStatus;
  replacement_value: number;
  checked_out_at: string | null;
  due_at: string | null;
  returned_at: string | null;
  lost_at: string | null;
  notes: string | null;
  created_at: string;
  books?: Pick<Book, "id" | "title" | "slug" | "cover_url"> & { authors?: { name: string } | null };
  profiles?: Profile | null;
};

export const OPEN_RENTAL_STATUSES: RentalStatus[] = ["pending", "out", "returning"];
export const OUT_RENTAL_STATUSES: RentalStatus[] = ["out", "returning"];

/** A shelf tile: a book plus how many times it has been borrowed. */
export type ShelfBook = Book & { borrowed?: number };

/* -------------------------------------------------------------------------- */
/* Shipments — one row per trip                                               */
/* -------------------------------------------------------------------------- */

export type ShipmentType = "outbound" | "swap" | "return";

export type ShipmentStatus =
  | "pending"
  | "awaiting_post"
  | "packed"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled";

export type Shipment = {
  id: string;
  user_id: string;
  order_id: string | null;
  subscription_id: string | null;
  address_id: string | null;
  type: ShipmentType;
  courier: string;
  status: ShipmentStatus;
  customer_charge: number;
  merchant_charge: number;
  tracking: string | null;
  bdpost_receipt: string | null;
  notes: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  created_at: string;
  profiles?: Profile | null;
  addresses?: Address | null;
  orders?: { order_number: string } | null;
  shipment_items?: ShipmentItem[];
};

export type ShipmentItem = {
  id: string;
  shipment_id: string;
  rental_id: string;
  direction: "out" | "in";
  rentals?: Rental | null;
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
  courier: string | null;
  trip_type: string | null;
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
  refund_requested_at: string | null;
  refund_requested_note: string | null;
  notes: string | null;
  created_at: string;
  profiles?: Profile | null;
};

export type NotificationKind =
  | "renewal"
  | "dispatch"
  | "return"
  | "deposit"
  | "overdue"
  | "custom";

export type AppNotification = {
  id: string;
  user_id: string | null;
  kind: NotificationKind;
  channel: string;
  subject: string | null;
  body: string;
  phone: string | null;
  email: string | null;
  status: "queued" | "sent" | "failed" | "manual";
  sent_at: string | null;
  error: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  profiles?: Profile | null;
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

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

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

export type PaymentSettings = {
  enabled: boolean;
  instructions: string;
  methods: PaymentMethodInfo[];
};

/** One courier: total charge plus the share the customer pays. */
export type CourierMethod = {
  key: string;
  label: string;
  charge: number;
  percent: number;
  return_charge?: number | null;
  note?: string;
};

export type CourierSettings = {
  methods: CourierMethod[];
  bdpost: {
    label: string;
    charge: number;
    max_kg: number;
    rules: string;
  };
};

export type RentalSettings = {
  duration_days: number;
  block_overdue: boolean;
  renew_notice_days: number;
  max_parallel_rentals: number;
};

export type WhatsappSettings = {
  country_code: string;
  renew_text: string;
  order_text: string;
};

export type WarehouseSettings = {
  name: string;
  phone: string;
  address: string;
};

export type DashboardStats = {
  active_subscriptions: number;
  pending_subscriptions: number;
  customers: number;
  pending_payments: number;
  open_requests: number;
  titles: number;
  held_deposits: number;
  deposits_requested: number;
  mrr: number;
  books_out: number;
  to_ship: number;
  returns_pending: number;
  overdue_rentals: number;
  notifications_queued: number;
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

export const DEFAULT_COURIERS: CourierSettings = {
  methods: [
    { key: "steadfast", label: "Steadfast", charge: 80, percent: 50, return_charge: 80 },
    { key: "pathao", label: "Pathao", charge: 80, percent: 50, return_charge: 80 },
    { key: "redx", label: "RedX", charge: 80, percent: 50, return_charge: 80 },
    { key: "other", label: "Other courier", charge: 80, percent: 50, return_charge: 80 },
  ],
  bdpost: {
    label: "BD Post",
    charge: 0,
    max_kg: 5,
    rules:
      "Write BOOK POST clearly on the packet. Only books inside. Keep the post office receipt and enter the number here.",
  },
};

export const DEFAULT_RENTAL: RentalSettings = {
  duration_days: 30,
  block_overdue: true,
  renew_notice_days: 3,
  max_parallel_rentals: 0,
};

export const DEFAULT_WHATSAPP: WhatsappSettings = {
  country_code: "880",
  renew_text:
    'Hello {name}, your REY BD plan "{plan}" expires on {expires} ({days} days left). Renew here: {renew}',
  order_text: "Hello {name}, your REY BD books are on the way. Books: {books}. Please reply to confirm.",
};

export const DEFAULT_WAREHOUSE: WarehouseSettings = {
  name: "REY BD Book Club",
  phone: "+880 17921 02092",
  address: "House # 28, Road # 8/A, Nikunjo-1, Dhaka-1229",
};

export const SHIPMENT_TYPE_LABEL: Record<ShipmentType, string> = {
  outbound: "First delivery",
  swap: "Swap (new books out + old books back)",
  return: "Return pickup",
};
