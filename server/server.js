import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import authRoutes from "./authRoutes.js";

dotenv.config();

const app = express();

// ================================
// CORS — разрешаем запросы с фронтенда
// В продакшене через nginx proxy CORS не нужен,
// но оставляем для локальной разработки
// ================================
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ================================
// Роуты авторизации
// ================================
app.use("/api", authRoutes);

// ================================
// Health check
// ================================
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ================================
// 404 handler
// ================================
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ================================
// Error handler
// ================================
app.use((err, req, res, next) => {
  console.error("[server] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ================================
// Запуск сервера
// ================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Auth server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

export default app;
