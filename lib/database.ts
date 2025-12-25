import Database from "better-sqlite3";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "lunaby.db");
const FALLBACK_PATH = path.join(process.cwd(), "Fallback.json");

let db: Database.Database | null = null;
let useFallback = false;
let fallbackData: FallbackData | null = null;

interface FallbackSection {
  title: string;
  slug: string;
  content: string;
  description: string;
  group_name: string;
  order_index: number;
  is_sub_item: boolean;
  is_published: boolean;
}

interface FallbackData {
  version: string;
  exportedAt?: string;
  sections: FallbackSection[];
}

function loadFallbackData(): FallbackData | null {
  try {
    if (fs.existsSync(FALLBACK_PATH)) {
      const content = fs.readFileSync(FALLBACK_PATH, "utf-8");
      return JSON.parse(content) as FallbackData;
    }
  } catch {
    console.warn("Failed to load Fallback.json");
  }
  return null;
}

function tryInitDatabase(): boolean {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initializeSchema();
    return true;
  } catch (error) {
    console.warn("SQLite initialization failed, using fallback JSON:", error);
    return false;
  }
}

export function getDatabase(): Database.Database | null {
  if (useFallback) return null;

  if (!db) {
    if (!tryInitDatabase()) {
      useFallback = true;
      fallbackData = loadFallbackData();
      return null;
    }
  }
  return db;
}

export function isUsingFallback(): boolean {
  return useFallback;
}

function initializeSchema() {
  const database = db!;

  database.exec(`
    -- Documentation sections table
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT,
      description TEXT,
      order_index INTEGER DEFAULT 0,
      group_name TEXT DEFAULT 'General',
      is_sub_item BOOLEAN DEFAULT 0,
      is_published BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- API Keys table
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      key TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME,
      requests_count INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1
    );

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Admin users table (separate from regular users)
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME
    );

    -- Usage logs table
    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_key_id INTEGER,
      endpoint TEXT NOT NULL,
      model TEXT,
      tokens_used INTEGER DEFAULT 0,
      response_time_ms INTEGER,
      status_code INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
    );

    -- Models configuration table
    CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT 1,
      rate_limit INTEGER DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_sections_slug ON sections(slug);
    CREATE INDEX IF NOT EXISTS idx_sections_order ON sections(order_index);
    CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
    CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
    CREATE INDEX IF NOT EXISTS idx_usage_logs_api_key ON usage_logs(api_key_id);
    CREATE INDEX IF NOT EXISTS idx_usage_logs_created ON usage_logs(created_at);
  `);

  // Insert default sections if empty
  const sectionCount = database.prepare("SELECT COUNT(*) as count FROM sections").get() as { count: number };
  if (sectionCount.count === 0) {
    insertDefaultSections(database);
  }

  // Insert default models if empty
  const modelCount = database.prepare("SELECT COUNT(*) as count FROM models").get() as { count: number };
  if (modelCount.count === 0) {
    insertDefaultModels(database);
  }
}

function insertDefaultSections(database: Database.Database) {
  const insertSection = database.prepare(`
    INSERT INTO sections (title, slug, description, group_name, order_index, is_sub_item, is_published)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  const sections = [
    { title: "Introduction", slug: "introduction", desc: "Welcome to the API", group: "General", order: 1, sub: 0 },
    { title: "Error Codes", slug: "errors", desc: "HTTP status codes", group: "General", order: 2, sub: 0 },
    { title: "List Models", slug: "chat-models", desc: "Available models", group: "General", order: 3, sub: 0 },
    { title: "Ecosystem", slug: "ecosystem", desc: "Platform components", group: "General", order: 4, sub: 0 },
    { title: "Quick Start", slug: "quickstart", desc: "Get started quickly", group: "Guides", order: 5, sub: 0 },
    { title: "Chat Completions", slug: "chat-completions", desc: "Chat API usage", group: "Guides", order: 6, sub: 0 },
    { title: "Streaming", slug: "chat-streaming", desc: "Streaming responses", group: "Guides", order: 7, sub: 1 },
    { title: "Vision", slug: "chat-vision", desc: "Image generation", group: "Guides", order: 8, sub: 1 },
  ];

  for (const s of sections) {
    insertSection.run(s.title, s.slug, s.desc, s.group, s.order, s.sub);
  }
}

function insertDefaultModels(database: Database.Database) {
  const insertModel = database.prepare(`
    INSERT INTO models (name, display_name, description) VALUES (?, ?, ?)
  `);

  insertModel.run("lunaby-pro", "Lunaby Pro", "High-performance model for complex tasks.");
  insertModel.run("lunaby", "Lunaby", "Standard versatile model for general use.");
  insertModel.run("lunaby-vision", "Lunaby Vision", "Image generation model.");
}

// ============ Sections CRUD ============

export interface Section {
  id: number;
  title: string;
  slug: string;
  content: string | null;
  description: string | null;
  order_index: number;
  group_name: string;
  is_sub_item: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export function getAllSections(): Section[] {
  const database = getDatabase();

  // Fallback to JSON if SQLite is not available
  if (!database && fallbackData) {
    return fallbackData.sections.map((s, index) => ({
      id: index + 1,
      title: s.title,
      slug: s.slug,
      content: s.content,
      description: s.description,
      order_index: s.order_index,
      group_name: s.group_name,
      is_sub_item: s.is_sub_item,
      is_published: s.is_published,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }

  if (!database) return [];

  return database.prepare(`
    SELECT * FROM sections ORDER BY order_index ASC
  `).all() as Section[];
}

export function getPublishedSections(): Section[] {
  const database = getDatabase();

  // Fallback to JSON if SQLite is not available
  if (!database && fallbackData) {
    return fallbackData.sections
      .filter(s => s.is_published)
      .map((s, index) => ({
        id: index + 1,
        title: s.title,
        slug: s.slug,
        content: s.content,
        description: s.description,
        order_index: s.order_index,
        group_name: s.group_name,
        is_sub_item: s.is_sub_item,
        is_published: s.is_published,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
  }

  if (!database) return [];

  return database.prepare(`
    SELECT * FROM sections WHERE is_published = 1 ORDER BY order_index ASC
  `).all() as Section[];
}

export function getSectionBySlug(slug: string): Section | undefined {
  const database = getDatabase();

  // Fallback to JSON if SQLite is not available
  if (!database && fallbackData) {
    const found = fallbackData.sections.find(s => s.slug === slug);
    if (found) {
      return {
        id: fallbackData.sections.indexOf(found) + 1,
        title: found.title,
        slug: found.slug,
        content: found.content,
        description: found.description,
        order_index: found.order_index,
        group_name: found.group_name,
        is_sub_item: found.is_sub_item,
        is_published: found.is_published,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    return undefined;
  }

  if (!database) return undefined;

  return database.prepare(`
    SELECT * FROM sections WHERE slug = ?
  `).get(slug) as Section | undefined;
}

export function createSection(data: {
  title: string;
  slug: string;
  content?: string;
  description?: string;
  group_name?: string;
  is_sub_item?: boolean;
  is_published?: boolean;
}) {
  const database = getDatabase();

  // Fallback mode: read-only, cannot create
  if (!database) {
    throw new Error("Database not available. Running in read-only fallback mode.");
  }

  const maxOrder = database.prepare("SELECT MAX(order_index) as max FROM sections").get() as { max: number | null };
  const orderIndex = (maxOrder.max || 0) + 1;

  const stmt = database.prepare(`
    INSERT INTO sections (title, slug, content, description, group_name, order_index, is_sub_item, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.title,
    data.slug,
    data.content || null,
    data.description || null,
    data.group_name || "General",
    orderIndex,
    data.is_sub_item ? 1 : 0,
    data.is_published !== false ? 1 : 0
  );

  return { id: result.lastInsertRowid };
}

export function updateSection(id: number, data: Partial<{
  title: string;
  slug: string;
  content: string;
  description: string;
  group_name: string;
  order_index: number;
  is_sub_item: boolean;
  is_published: boolean;
}>) {
  const database = getDatabase();

  // Fallback mode: read-only, cannot update
  if (!database) {
    throw new Error("Database not available. Running in read-only fallback mode.");
  }

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (data.title !== undefined) { updates.push("title = ?"); values.push(data.title); }
  if (data.slug !== undefined) { updates.push("slug = ?"); values.push(data.slug); }
  if (data.content !== undefined) { updates.push("content = ?"); values.push(data.content); }
  if (data.description !== undefined) { updates.push("description = ?"); values.push(data.description); }
  if (data.group_name !== undefined) { updates.push("group_name = ?"); values.push(data.group_name); }
  if (data.order_index !== undefined) { updates.push("order_index = ?"); values.push(data.order_index); }
  if (data.is_sub_item !== undefined) { updates.push("is_sub_item = ?"); values.push(data.is_sub_item ? 1 : 0); }
  if (data.is_published !== undefined) { updates.push("is_published = ?"); values.push(data.is_published ? 1 : 0); }

  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);

  const stmt = database.prepare(`
    UPDATE sections SET ${updates.join(", ")} WHERE id = ?
  `);

  return stmt.run(...values);
}

export function deleteSection(id: number) {
  const database = getDatabase();

  // Fallback mode: read-only, cannot delete
  if (!database) {
    throw new Error("Database not available. Running in read-only fallback mode.");
  }

  return database.prepare("DELETE FROM sections WHERE id = ?").run(id);
}

// ============ API Keys ============

export function createApiKey(name: string, userId?: number) {
  const database = getDatabase();
  if (!database) {
    throw new Error("Database not available. Running in read-only fallback mode.");
  }
  const key = `lnby_${generateRandomKey(32)}`;

  const stmt = database.prepare(`
    INSERT INTO api_keys (name, key, user_id) VALUES (?, ?, ?)
  `);

  const result = stmt.run(name, key, userId || null);
  return { id: result.lastInsertRowid, key };
}

export function getAllApiKeys() {
  const database = getDatabase();
  if (!database) return [];
  return database.prepare(`
    SELECT id, name, key, created_at, last_used_at, requests_count, is_active
    FROM api_keys ORDER BY created_at DESC
  `).all();
}

export function getApiKeyByKey(key: string) {
  const database = getDatabase();
  if (!database) return undefined;
  return database.prepare(`
    SELECT * FROM api_keys WHERE key = ? AND is_active = 1
  `).get(key);
}

export function updateApiKeyUsage(keyId: number) {
  const database = getDatabase();
  if (!database) return;
  return database.prepare(`
    UPDATE api_keys
    SET last_used_at = CURRENT_TIMESTAMP, requests_count = requests_count + 1
    WHERE id = ?
  `).run(keyId);
}

export function deactivateApiKey(keyId: number) {
  const database = getDatabase();
  if (!database) {
    throw new Error("Database not available. Running in read-only fallback mode.");
  }
  return database.prepare("UPDATE api_keys SET is_active = 0 WHERE id = ?").run(keyId);
}

// ============ Models ============

export function getAllModels() {
  const database = getDatabase();
  if (!database) return [];
  return database.prepare("SELECT * FROM models WHERE is_active = 1 ORDER BY name").all();
}

// ============ Usage Stats ============

export function getUsageStats(days: number = 7) {
  const database = getDatabase();
  if (!database) return [];
  return database.prepare(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as requests,
      SUM(tokens_used) as total_tokens,
      AVG(response_time_ms) as avg_response_time
    FROM usage_logs
    WHERE created_at >= datetime('now', '-' || ? || ' days')
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `).all(days);
}

// ============ Utilities ============

function generateRandomKey(length: number): string {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
