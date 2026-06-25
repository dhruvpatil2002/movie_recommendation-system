"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendRouter = void 0;
const express_1 = require("express");
const recommended_controller_1 = require("../controllers/recommended.controller");
exports.recommendRouter = (0, express_1.Router)();
exports.recommendRouter.post("/", recommended_controller_1.recommendedMovies);
