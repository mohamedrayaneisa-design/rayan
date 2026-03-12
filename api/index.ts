import express from "express";
import pg from "pg";
import cors from "cors";
import dns from "dns";

dns.setDefaultResultOrder('ipv4first');

const { Pool } = pg;
const DATABASE_URL = "postgresql://postgres.wambkpiwyhighjqrnhcu:ontrayyanfinder112233@aws-1-eu-central-1.pooler.supabase.com:6543/postgres";

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS utilisateurs (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Technicien',
        security_question TEXT,
        security_answer TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ont_records (
        id TEXT PRIMARY KEY,
        msan TEXT,
        location TEXT,
        sn TEXT,
        version TEXT,
        vendor_id TEXT,
        status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create default admin if not exists
    const adminCheck = await pool.query("SELECT * FROM utilisateurs WHERE username = 'admin'");
    if (adminCheck.rows.length === 0) {
      await pool.query(
        "INSERT INTO utilisateurs (username, password, role) VALUES ($1, $2, $3)",
        ["admin", "admin", "Super Admin"]
      );
      console.log("Default admin created");
    }
    
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Database initialization error:", err);
  }
};

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options(/.*/, cors());
app.use(express.json());

// API Health check
app.get("/api/health", (req, res) => {
  res.status(200).send("ONT Finder Pro API is running");
});

// Auth Routes
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM utilisateurs WHERE username = $1 AND password = $2",
      [username, password]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({ success: true, user: { username: user.username, role: user.role } });
    } else {
      res.status(401).json({ success: false, message: "Identifiant ou mot de passe incorrect" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

app.post("/api/auth/register/bulk", async (req, res) => {
  const { users } = req.body;
  try {
    await pool.query("BEGIN");
    for (const user of users) {
      const { username, password, role } = user;
      await pool.query(
        "INSERT INTO utilisateurs (username, password, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING",
        [username, password, role || 'Technicien']
      );
    }
    await pool.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Bulk register error:", err);
    res.status(500).json({ success: false, message: "Erreur lors de la création groupée" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { username, password, role, securityQuestion, securityAnswer } = req.body;
  try {
    await pool.query(
      "INSERT INTO utilisateurs (username, password, role, security_question, security_answer) VALUES ($1, $2, $3, $4, $5)",
      [username, password, role || 'Technicien', securityQuestion, securityAnswer]
    );
    res.json({ success: true });
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(400).json({ success: false, message: "Ce nom d'utilisateur est déjà pris" });
    } else {
      console.error("Register error:", err);
      res.status(500).json({ success: false, message: "Erreur lors de la création du compte" });
    }
  }
});

app.post("/api/auth/recovery/question", async (req, res) => {
  const { username } = req.body;
  try {
    const result = await pool.query("SELECT security_question FROM utilisateurs WHERE username = $1", [username]);
    if (result.rows.length > 0) {
      res.json({ success: true, question: result.rows[0].security_question });
    } else {
      res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }
  } catch (err) {
    console.error("Recovery question error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

app.post("/api/auth/recovery/verify", async (req, res) => {
  const { username, answer } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM utilisateurs WHERE username = $1 AND security_answer = $2",
      [username, answer]
    );
    if (result.rows.length > 0) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Réponse incorrecte" });
    }
  } catch (err) {
    console.error("Recovery verify error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

app.post("/api/auth/recovery/reset", async (req, res) => {
  const { username, password } = req.body;
  try {
    await pool.query(
      "UPDATE utilisateurs SET password = $1 WHERE username = $2",
      [password, username]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Recovery reset error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// User Management Routes
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT username, role, created_at as \"createdAt\" FROM utilisateurs ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

app.delete("/api/users/:username", async (req, res) => {
  const { username } = req.params;
  if (username === 'admin') {
    return res.status(403).json({ success: false, message: "Impossible de supprimer l'administrateur par défaut" });
  }
  try {
    await pool.query("DELETE FROM utilisateurs WHERE username = $1", [username]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

app.patch("/api/users/:username/role", async (req, res) => {
  const { username } = req.params;
  const { role } = req.body;
  if (username === 'admin') {
    return res.status(403).json({ success: false, message: "Impossible de modifier le rôle de l'administrateur par défaut" });
  }
  try {
    await pool.query("UPDATE utilisateurs SET role = $1 WHERE username = $2", [role, username]);
    res.json({ success: true });
  } catch (err) {
    console.error("Update role error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ONT Records Routes
app.get("/api/ont-data", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, msan, location, sn, version, vendor_id as \"vendorId\", status FROM ont_records");
    res.json({ records: result.rows, lastUpdated: new Date().toLocaleString() });
  } catch (err) {
    console.error("Get ONT data error:", err);
    res.status(500).json({ success: false, message: "Erreur lors de la récupération des données" });
  }
});

app.post("/api/ont-data", async (req, res) => {
  const { records } = req.body;
  try {
    await pool.query("BEGIN");
    // For simplicity, we clear and re-insert. In a real app, we'd do upserts.
    await pool.query("DELETE FROM ont_records");
    for (const record of records) {
      await pool.query(
        "INSERT INTO ont_records (id, msan, location, sn, version, vendor_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [record.id, record.msan, record.location, record.sn, record.version, record.vendorId, record.status]
      );
    }
    await pool.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Save ONT data error:", err);
    res.status(500).json({ success: false, message: "Erreur lors de la sauvegarde des données" });
  }
});

app.delete("/api/ont-data", async (req, res) => {
  try {
    await pool.query("DELETE FROM ont_records");
    res.json({ success: true });
  } catch (err) {
    console.error("Delete ONT data error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// Initialize DB on first load for Vercel
initDb().catch(console.error);

export default app;
