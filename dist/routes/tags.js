"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagsRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
router.get("/", async (_req, res) => {
    const tags = await db_1.prisma.tag.findMany({ orderBy: { name: "asc" } });
    res.json(tags);
});
exports.tagsRouter = router;
