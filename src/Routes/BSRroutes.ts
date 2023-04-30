
import { Response, Router, Request } from "express";
import { User } from "../model/model";
import { Types } from "mongoose";
import { ObjectId } from "mongodb";

export let BSRroutes = Router()

//! Get users
BSRroutes.get("/users", async (req: Request, res: Response) => {

    try {
        let users = await User.find()

        res.json(users)
    }
    catch (err: any) {
        res.json({ error: err.message })
    }

})

//! Get a user
BSRroutes.get("/user/:id", async (req: Request, res: Response) => {

    try {

        let id = req.params.id

        if (!Types.ObjectId.isValid(id)) {
            return res.json({ error: "The user's id is invalid" })
        }

        let user = await User.findOne({ _id: new ObjectId(id) })
        res.json(user)

    }
    catch (err: any) {
        res.json({ error: err.message })
    }
})

//! Add a user
BSRroutes.post("/user", async (req: Request, res: Response) => {
    try {
        let user = req.body

        console.log(user);
        await User.create(user)
        res.json({ success: "user has been created successfully" })

    } catch (err: any) {
        res.json({ fail: err.message })
    }
})

//! Delete a user
BSRroutes.delete("/user/:id", async (req: Request, res: Response) => {
    try {

        let id = req.params.id

        if (!Types.ObjectId.isValid(id)) {
            return res.json({ error: "The user's id is invalid" })
        }

        let message = await User.deleteOne({ _id: new ObjectId(id) })
        res.json(message)
    }
    catch (err: any) {
        res.json({ error: err.message })
    }

})

//! Update a user
BSRroutes.put("/update/:id", async (req: Request, res: Response) => {

    try {

        let id = req.params.id
        let { name, age, job, country } = req.body;

        if (!Types.ObjectId.isValid(id)) {
            return res.json({ error: "The user's id is invalid" })
        }

        let update = await User.updateOne({ _id: new ObjectId(id) }, { $set: { name, age, job, country } })

        res.json(update)
    }
    catch (err: any) {

        res.json({ error: err.message })
    }

})


//! Uploading an image to the file system
import multer from "multer"
import path from "path"

let Storage = multer.diskStorage({

    destination: (req, file, callback) => {
        callback(null, '../React/public/database')
    },

    filename: (req, file, callback) => {
        console.log(file);

        callback(null, Date.now() + path.extname(file.originalname))
    }
})
let upload = multer({ storage: Storage })

BSRroutes.post("/image", upload.single("image"), async (req: Request, res: Response) => {
    res.json({ success: "image has been uploaded" })
})

//! Uploading Images to mongodb & firebase
import { image } from "../model/model";
import { initializeApp } from "firebase/app";
import config from "./firebase"
import { getStorage, ref, getDownloadURL, uploadBytesResumable, deleteObject }
    from "firebase/storage"

//* Initializing Firebase
initializeApp(config.firebaseConfig)
let storage = getStorage();

//* Multer
let uploadImage = multer({ storage: multer.memoryStorage() })

//! Uploading Images to mongodb & firebase
BSRroutes.post("/MongoFirebase", uploadImage.single("image"), async (req: Request, res: Response) => {

    try {
        let { originalname, mimetype } = req.file!
        let { title, pages } = req.body
        let filename = originalname + "  " + Date.now()

        //* Uploading the image's information to mongodb
        let response = await image.create({ pages, title, filename, mimetype })

        //* Passing the name of the folder & the name of the image in the folder
        let storageRef = ref(storage, `images/${filename}`)

        //* Passing the type of the uploaded file
        let metaData = { contentType: mimetype }

        //* upload the image to firebase storage
        let snapshot = await uploadBytesResumable(storageRef, req.file!.buffer, metaData)

        //* The ure that is gonna show the image in the frontend
        let downloadURL = await getDownloadURL(snapshot.ref)

        res.json({
            message: "image has been uploaded to firebase storage & mongodb",
            name: originalname, type: mimetype, downloadURL, response
        })
    }
    catch (err: any) {
        res.json({ error: err.message })
    }
})

//! Getting images from Firebase & mongodb
BSRroutes.get("/MongoFirebase", async (req: Request, res: Response) => {

    try {
        //* Fetching images data from MongoDB
        let images = await image.find();

        //* Looping through the images data and generating download URLs for each image
        let imagesWithUrls = await Promise.all(images.map(async (imageData: any) => {

            let downloadURL = await getDownloadURL(ref(storage, `images/${imageData.filename}`));

            return { ...imageData._doc, downloadURL };
        }));

        res.status(200).json(imagesWithUrls);
    }
    catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

//! Getting one image from firebase & mongodb
BSRroutes.get("/MongodbFirebase/:id", async (req: Request, res: Response) => {

    try {
        let id = req.params.id

        //* Fetching the image from mongodb
        let TheImage: any = await image.findOne({ _id: new ObjectId(id) })

        if (!TheImage) {
            return res.status(404).json({ error: "Image not found" })
        }

        //* Generating download URLs for the image from firebase based on the image's name in mongodb
        let storageRef = ref(storage, `images/${TheImage.filename}`);
        let downloadURL = await getDownloadURL(storageRef);

        //* Add the downloadUrl to the image
        // OR TheImage.downloadURL = downloadURL

        res.status(200).json({ ...TheImage._doc, downloadURL })
    }
    catch (err: any) {
        res.json({ error: err.message })
    }
})

//! Deleting an image from mongodb & firebase
BSRroutes.delete("/MongodbFirebase/:id", async (req: Request, res: Response) => {

    try {
        let id = req.params.id

        //* Fetching the image from mongodb
        let TheImage: any = await image.findOne({ _id: new ObjectId(id) })

        if (!TheImage) {
            return res.status(404).json({ error: "Image not found" })
        }

        //* Deleting the document from mongodb
        await image.findByIdAndDelete(id)

        //* Deleting the image from firebase
        let storageRef = ref(storage, `images/${TheImage.filename}`);
        await deleteObject(storageRef)

        res.json({ message: "Image has been successfully deleted" })
    }
    catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

//! Updating an image in mongodb & firebase
BSRroutes.put("/MongodbFirebase/:id", uploadImage.single("image"), async (req: Request, res: Response) => {

    try {
        let id = req.params.id;
        let { originalname, mimetype } = req.file!
        let { title } = req.body
        let filename = originalname + "  " + Date.now() //* The new filename

        let TheImage = await image.findById(id);

        if (!TheImage) {
            return res.status(404).json({ error: "Couldn't update the image because it doesn't exist" })
        }

        //* Delete existing image file from Firebase Storage based on the old filename
        await deleteObject(ref(storage, `images/${TheImage.filename}`));

        let metaData = { contentType: mimetype }

        //* Passing the name of the folder & the name of the new image in the folder
        let storageRef = ref(storage, `images/${filename}`)

        //* Uploading the new image to firebase
        let UpdatedSnapshot = await uploadBytesResumable(storageRef, req.file!.buffer, metaData);
        const downloadURL = await getDownloadURL(UpdatedSnapshot.ref);

        //* Updating the data in mongodb 
        await image.findByIdAndUpdate(id, { title, filename, mimetype })

        return res.json({ message: "Image has been updated", downloadURL });
    }
    catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})


//! Openai Api Chatbot
import { ChatCompletionRequestMessageRoleEnum, Configuration, OpenAIApi } from "openai";

let configuration = new Configuration({
    organization: 'org-TYxVbrXhMZ1WPFMlC1kazaPK',
    apiKey: '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'
})
let openai = new OpenAIApi(configuration)

BSRroutes.post("/openai", async (req: Request, res: Response) => {

    try {
        let { questions }: { questions: { role: ChatCompletionRequestMessageRoleEnum, content: string }[] } = req.body;
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
        })
        res.status(200).json(completion.data.choices[0].message!.content)
    }
    catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})


//! Openai Image generating 
BSRroutes.post("/generatingImage", async (req: Request, res: Response) => {
    try {

        let { prompt, size } = req.body;
        let imageSize: "1024x1024" | "512x512" | "256x256";

        if (size === "small") {
            imageSize = "256x256"
        } else if (size === "medium") {
            imageSize = "512x512"
        } else { imageSize = "1024x1024" }


        let response = await openai.createImage({
            prompt: prompt,  //* The image prompt
            n: 1,            //* number of images
            size: imageSize, //* The imageSize
            response_format:"url"
        })

        let imageUrl = response.data.data[0].url;

        res.json({ imageUrl })
    }
    catch (err: any) {
        console.log(err.response.status, err.response.data);

        res.json({ error: err.message })
    }
})

