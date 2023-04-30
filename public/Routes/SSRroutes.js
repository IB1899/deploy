"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSRroutes = void 0;
const express_1 = require("express");
const model_1 = require("../model/model");
exports.SSRroutes = (0, express_1.Router)();
exports.SSRroutes.use((req, res, next) => {
    // console.log(req.hostname, req.path, req.method, req.httpVersion);
    next();
});
exports.SSRroutes.post("/", async (req, res) => {
    try {
        let user = req.body;
        console.log(user);
        await model_1.User.create(user);
        res.json({ success: "user has been created successfully" });
    }
    catch (err) {
        console.log(err);
        res.json({ fail: err.message });
    }
});
exports.SSRroutes.get("/", async (req, res) => {
    let users = await model_1.User.find();
    res.render("home", { users });
});
exports.SSRroutes.get("/about", (req, res) => {
    res.render("about", { passedValue: true });
});
exports.SSRroutes.use((req, res) => {
    res.send("404 Page doesn't exist");
});
