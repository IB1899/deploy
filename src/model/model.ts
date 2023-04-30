import { Schema, model, connect } from "mongoose";

let userSchema = new Schema({

    name: { type: String, required: true },
    age: { type: Number, required: true },
    job: { type: String, required: true },
    country: { type: String, required: true }
}, { timestamps: true })
export let User = model('user', userSchema)

let imageSchema = new Schema({

    title: { type: String, required: true },
    pages: { type: Number, required: true },
    filename: { type: String, required: true },// File name
    mimetype: { type: String, required: true }, // File MIME type

}, { timestamps: true })
export let image = model('image', imageSchema)


export let DBconnection = async (callback: Function) => {

    try {
        await connect('mongodb+srv://IbrahimAli:ibrahim12$@ibrahimali.wxcjdla.mongodb.net/Authentication?retryWrites=true&w=majority')
        console.log("connected to mongodb");
        callback()
    }
    catch (err) {
        console.log(err);
    }
}