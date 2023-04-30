"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BSRroutes = void 0;
const express_1 = require("express");
const model_1 = require("../model/model");
const mongoose_1 = require("mongoose");
const mongodb_1 = require("mongodb");
exports.BSRroutes = (0, express_1.Router)();
//! Get users
exports.BSRroutes.get("/users", async (req, res) => {
    try {
        let users = await model_1.User.find();
        res.json(users);
    }
    catch (err) {
        res.json({ error: err.message });
    }
});
//! Get a user
exports.BSRroutes.get("/user/:id", async (req, res) => {
    try {
        let id = req.params.id;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.json({ error: "The user's id is invalid" });
        }
        let user = await model_1.User.findOne({ _id: new mongodb_1.ObjectId(id) });
        res.json(user);
    }
    catch (err) {
        res.json({ error: err.message });
    }
});
//! Add a user
exports.BSRroutes.post("/user", async (req, res) => {
    try {
        let user = req.body;
        console.log(user);
        await model_1.User.create(user);
        res.json({ success: "user has been created successfully" });
    }
    catch (err) {
        res.json({ fail: err.message });
    }
});
//! Delete a user
exports.BSRroutes.delete("/user/:id", async (req, res) => {
    try {
        let id = req.params.id;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.json({ error: "The user's id is invalid" });
        }
        let message = await model_1.User.deleteOne({ _id: new mongodb_1.ObjectId(id) });
        res.json(message);
    }
    catch (err) {
        res.json({ error: err.message });
    }
});
//! Update a user
exports.BSRroutes.put("/update/:id", async (req, res) => {
    try {
        let id = req.params.id;
        let { name, age, job, country } = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.json({ error: "The user's id is invalid" });
        }
        let update = await model_1.User.updateOne({ _id: new mongodb_1.ObjectId(id) }, { $set: { name, age, job, country } });
        res.json(update);
    }
    catch (err) {
        res.json({ error: err.message });
    }
});
//! Uploading an image to the file system
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
let Storage = multer_1.default.diskStorage({
    destination: (req, file, callback) => {
        callback(null, '../React/public/database');
    },
    filename: (req, file, callback) => {
        console.log(file);
        callback(null, Date.now() + path_1.default.extname(file.originalname));
    }
});
let upload = (0, multer_1.default)({ storage: Storage });
exports.BSRroutes.post("/image", upload.single("image"), async (req, res) => {
    res.json({ success: "image has been uploaded" });
});
//! Uploading Images to mongodb & firebase
const model_2 = require("../model/model");
const app_1 = require("firebase/app");
const firebase_1 = __importDefault(require("./firebase"));
const storage_1 = require("firebase/storage");
//* Initializing Firebase
(0, app_1.initializeApp)(firebase_1.default.firebaseConfig);
let storage = (0, storage_1.getStorage)();
//* Multer
let uploadImage = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
//! Uploading Images to mongodb & firebase
exports.BSRroutes.post("/MongoFirebase", uploadImage.single("image"), async (req, res) => {
    try {
        let { originalname, mimetype } = req.file;
        let { title, pages } = req.body;
        let filename = originalname + "  " + Date.now();
        //* Uploading the image's information to mongodb
        let response = await model_2.image.create({ pages, title, filename, mimetype });
        //* Passing the name of the folder & the name of the image in the folder
        let storageRef = (0, storage_1.ref)(storage, `images/${filename}`);
        //* Passing the type of the uploaded file
        let metaData = { contentType: mimetype };
        //* upload the image to firebase storage
        let snapshot = await (0, storage_1.uploadBytesResumable)(storageRef, req.file.buffer, metaData);
        //* The ure that is gonna show the image in the frontend
        let downloadURL = await (0, storage_1.getDownloadURL)(snapshot.ref);
        res.json({
            message: "image has been uploaded to firebase storage & mongodb",
            name: originalname, type: mimetype, downloadURL, response
        });
    }
    catch (err) {
        res.json({ error: err.message });
    }
});
//! Getting images from Firebase & mongodb
exports.BSRroutes.get("/MongoFirebase", async (req, res) => {
    try {
        //* Fetching images data from MongoDB
        let images = await model_2.image.find();
        //* Looping through the images data and generating download URLs for each image
        let imagesWithUrls = await Promise.all(images.map(async (imageData) => {
            let downloadURL = await (0, storage_1.getDownloadURL)((0, storage_1.ref)(storage, `images/${imageData.filename}`));
            return Object.assign(Object.assign({}, imageData._doc), { downloadURL });
        }));
        res.status(200).json(imagesWithUrls);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
//! Getting one image from firebase & mongodb
exports.BSRroutes.get("/MongodbFirebase/:id", async (req, res) => {
    try {
        let id = req.params.id;
        //* Fetching the image from mongodb
        let TheImage = await model_2.image.findOne({ _id: new mongodb_1.ObjectId(id) });
        if (!TheImage) {
            return res.status(404).json({ error: "Image not found" });
        }
        //* Generating download URLs for the image from firebase based on the image's name in mongodb
        let storageRef = (0, storage_1.ref)(storage, `images/${TheImage.filename}`);
        let downloadURL = await (0, storage_1.getDownloadURL)(storageRef);
        //* Add the downloadUrl to the image
        // OR TheImage.downloadURL = downloadURL
        res.status(200).json(Object.assign(Object.assign({}, TheImage._doc), { downloadURL }));
    }
    catch (err) {
        res.json({ error: err.message });
    }
});
//! Deleting an image from mongodb & firebase
exports.BSRroutes.delete("/MongodbFirebase/:id", async (req, res) => {
    try {
        let id = req.params.id;
        //* Fetching the image from mongodb
        let TheImage = await model_2.image.findOne({ _id: new mongodb_1.ObjectId(id) });
        if (!TheImage) {
            return res.status(404).json({ error: "Image not found" });
        }
        //* Deleting the document from mongodb
        await model_2.image.findByIdAndDelete(id);
        //* Deleting the image from firebase
        let storageRef = (0, storage_1.ref)(storage, `images/${TheImage.filename}`);
        await (0, storage_1.deleteObject)(storageRef);
        res.json({ message: "Image has been successfully deleted" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
//! Updating an image in mongodb & firebase
exports.BSRroutes.put("/MongodbFirebase/:id", uploadImage.single("image"), async (req, res) => {
    try {
        let id = req.params.id;
        let { originalname, mimetype } = req.file;
        let { title } = req.body;
        let filename = originalname + "  " + Date.now(); //* The new filename
        let TheImage = await model_2.image.findById(id);
        if (!TheImage) {
            return res.status(404).json({ error: "Couldn't update the image because it doesn't exist" });
        }
        //* Delete existing image file from Firebase Storage based on the old filename
        await (0, storage_1.deleteObject)((0, storage_1.ref)(storage, `images/${TheImage.filename}`));
        let metaData = { contentType: mimetype };
        //* Passing the name of the folder & the name of the new image in the folder
        let storageRef = (0, storage_1.ref)(storage, `images/${filename}`);
        //* Uploading the new image to firebase
        let UpdatedSnapshot = await (0, storage_1.uploadBytesResumable)(storageRef, req.file.buffer, metaData);
        const downloadURL = await (0, storage_1.getDownloadURL)(UpdatedSnapshot.ref);
        //* Updating the data in mongodb 
        await model_2.image.findByIdAndUpdate(id, { title, filename, mimetype });
        return res.json({ message: "Image has been updated", downloadURL });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
//! Openai Api Chatbot
const openai_1 = require("openai");
let configuration = new openai_1.Configuration({
    organization: 'org-TYxVbrXhMZ1WPFMlC1kazaPK',
    apiKey: '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'
});
let openai = new openai_1.OpenAIApi(configuration);
exports.BSRroutes.post("/openai", async (req, res) => {
    try {
        let { questions } = req.body;
        /*
        * To maintain the conversation history the rules should be like this
        * { role: 'system', content: 'You are a helpful assistant.' }, //todo configure
        * { role: 'user', content: 'Who won the world series in 2020?' }, //? question
        * { role: 'assistant', content: 'The Los Angeles Dodgers won the World Series in 2020.'}, //! answer
        * { role: 'user', content: 'Where was it played?' }, //? question
        * { role: 'assistant', content: 'The 2020 World Series was ... ' }, //! answer
        */
        let completion = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: "system", content: "content: 'You are a helpful assistant" },
                ...questions
            ]
        });
        res.status(200).json(completion.data.choices[0].message.content);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
//! Openai Image generating 
exports.BSRroutes.post("/generatingImage", async (req, res) => {
    try {
        let { prompt, size } = req.body;
        let imageSize;
        if (size === "small") {
            imageSize = "256x256";
        }
        else if (size === "medium") {
            imageSize = "512x512";
        }
        else {
            imageSize = "1024x1024";
        }
        let response = await openai.createImage({
            prompt: prompt,
            n: 1,
            size: imageSize,
            response_format: "url"
        });
        let imageUrl = response.data.data[0].url;
        res.json({ imageUrl });
    }
    catch (err) {
        console.log(err.response.status, err.response.data);
        res.json({ error: err.message });
    }
});
