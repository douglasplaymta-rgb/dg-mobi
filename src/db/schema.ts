import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("escola"),
  document: text("document"),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  city: text("city"),
  state: text("state"),
  address: text("address"),
  status: text("status").notNull().default("ativo"),
  notes: text("notes"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  eventDate: text("event_date").notNull(),
  origin: text("origin"),
  destination: text("destination"),
  passengers: integer("passengers").notNull().default(0),
  hours: integer("hours").notNull().default(0),
  vehicle: text("vehicle").default("Van Executiva"),
  status: text("status").notNull().default("agendado"),
  grossCents: integer("gross_cents").notNull().default(0),
  costCents: integer("cost_cents").notNull().default(0),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  txDate: text("tx_date").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("Operacional"),
  kind: text("kind").notNull(),
  amountCents: integer("amount_cents").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  number: text("number").notNull().unique(),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
  clientName: text("client_name").notNull(),
  clientDocument: text("client_document"),
  clientAddress: text("client_address"),
  eventDate: text("event_date"),
  origin: text("origin"),
  destination: text("destination"),
  passengers: integer("passengers").default(0),
  hours: integer("hours").default(0),
  vehicle: text("vehicle").default("Van Executiva"),
  priceMode: text("price_mode").default("fixo"),
  quantity: integer("quantity").default(1),
  unitPriceCents: integer("unit_price_cents").default(0),
  totalCents: integer("total_cents").notNull().default(0),
  validDays: integer("valid_days").default(15),
  notes: text("notes"),
  status: text("status").default("rascunho"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
});

export const registry = pgTable("registry", {
  id: serial("id").primaryKey(),
  holderName: text("holder_name").notNull(),
  docType: text("doc_type").notNull(),
  docNumber: text("doc_number").notNull(),
  personType: text("person_type").notNull().default("particular"),
  rgOrIe: text("rg_or_ie"),
  email: text("email"),
  phone: text("phone"),
  cep: text("cep"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  notes: text("notes"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Client = typeof clients.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type RegistryEntry = typeof registry.$inferSelect;
export type Setting = typeof settings.$inferSelect;

export const pixCharges = pgTable("pix_charges", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").references(() => quotes.id, { onDelete: "set null" }),
  externalReference: text("external_reference").notNull(),
  amountCents: integer("amount_cents").notNull(),
  qrCode: text("qr_code"),
  qrCodeBase64: text("qr_code_base64"),
  status: text("status").default("PENDING").notNull(),
  payerDocument: text("payer_document"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
  paidAt: text("paid_at"),
});

export type PixCharge = typeof pixCharges.$inferSelect;