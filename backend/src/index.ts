import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/components", (_req, res) => {
  res.json({
    components: [
      "Button",
      "Badge",
      "Card",
      "Input",
      "Textarea",
      "Select",
      "Checkbox",
      "Switch",
      "Tabs",
      "Avatar",
      "Alert",
      "Progress",
      "Accordion",
      "Dialog",
      "Tooltip",
      "Separator",
    ],
  });
});

const port = process.env.PORT ?? 4000;
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
