import express from "express";
import { supabase } from "./db.js";

const router = express.Router();

// ================================
// POST /api/register
// Регистрация нового пользователя
// ================================
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email и пароль обязательны" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Пароль должен быть не менее 6 символов" });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: name || "Пользователь" }
    }
  });

  if (error) {
    console.error("[authRoutes] Register error:", error.message);
    return res.status(400).json({ error: error.message });
  }

  console.log("[authRoutes] User registered:", data.user?.email);
  res.json({ user: data.user });
});

// ================================
// POST /api/login
// Авторизация пользователя
// ================================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email и пароль обязательны" });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error("[authRoutes] Login error:", error.message);
    return res.status(400).json({ error: "Неверный email или пароль" });
  }

  console.log("[authRoutes] User logged in:", data.user?.email);
  res.json({
    session: data.session,
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || "Пользователь"
    }
  });
});

// ================================
// POST /api/logout
// Выход пользователя
// ================================
router.post("/logout", async (req, res) => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ success: true });
});

// ================================
// GET /api/me
// Получить текущего пользователя по токену
// ================================
router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Не авторизован" });
  }

  const token = authHeader.split(" ")[1];
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: "Невалидный токен" });
  }

  res.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || "Пользователь"
    }
  });
});

export default router;
