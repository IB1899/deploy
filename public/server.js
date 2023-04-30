"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const SSRroutes_1 = require("./Routes/SSRroutes");
const dotenv_1 = __importDefault(require("dotenv"));
const BSRroutes_1 = require("./Routes/BSRroutes");
let server = (0, express_1.default)();
server.set("view engine", "ejs");
dotenv_1.default.config();
server.use(express_1.default.json());
server.use(express_1.default.static("views"));
const model_1 = require("./model/model");
(0, model_1.DBconnection)(() => server.listen(3001));
server.use(BSRroutes_1.BSRroutes);
server.use(SSRroutes_1.SSRroutes);
// import  "./algorithm"
