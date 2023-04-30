"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBconnection = exports.image = exports.User = void 0;
const mongoose_1 = require("mongoose");
let userSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    job: { type: String, required: true },
    country: { type: String, required: true }
}, { timestamps: true });
exports.User = (0, mongoose_1.model)('user', userSchema);
let imageSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    pages: { type: Number, required: true },
    filename: { type: String, required: true },
    mimetype: { type: String, required: true }, // File MIME type
}, { timestamps: true });
exports.image = (0, mongoose_1.model)('image', imageSchema);
let DBconnection = async (callback) => {
    try {
        await (0, mongoose_1.connect)('mongodb+srv://IbrahimAli:ibrahim12$@ibrahimali.wxcjdla.mongodb.net/Authentication?retryWrites=true&w=majority');
        console.log("connected to mongodb");
        callback();
    }
    catch (err) {
        console.log(err);
    }
};
exports.DBconnection = DBconnection;
