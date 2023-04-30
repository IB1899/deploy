
import express from "express";
import { SSRroutes } from "./Routes/SSRroutes";
import env from "dotenv"
import { BSRroutes } from "./Routes/BSRroutes";

let server = express();

server.set("view engine", "ejs")

env.config()

server.use(express.json())

server.use(express.static("views"))


import { DBconnection } from "./model/model";
DBconnection(() => server.listen(process.env.port))

server.use(BSRroutes)
server.use(SSRroutes)

// import  "./algorithm"