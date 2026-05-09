const express = require("express");
const app = express();

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Minimal server working" });
});

const PORT = 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ MINIMAL SERVER LISTENING on http://localhost:${PORT}`);
  console.log(`   Test: http://localhost:${PORT}/api/health`);
});