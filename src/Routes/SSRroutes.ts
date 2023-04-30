import { NextFunction, Request, Response, Router } from "express"
import { User } from "../model/model"
import { ObjectId } from "mongodb"

export let SSRroutes = Router()

SSRroutes.use((req: Request, res: Response, next: NextFunction) => {
    // console.log(req.hostname, req.path, req.method, req.httpVersion);
    next()
})

interface user {
    _id: ObjectId,
    name: string,
    age: number,
    job: string,
    country: string
}

SSRroutes.post("/", async (req: Request, res: Response) => {

    try {
        let user = req.body

        console.log(user);
        await User.create(user)
        res.json({ success: "user has been created successfully" })
        
    } catch (err: any) {
        console.log(err);
        res.json({ fail: err.message })
    }

})

SSRroutes.get("/", async (req: Request, res: Response) => {

    let users: user[] = await User.find()

    res.render("home", { users })
})

SSRroutes.get("/about", (req: Request, res: Response) => {

    res.render("about", { passedValue: true })
})

SSRroutes.use((req: Request, res: Response) => {
    res.send("404 Page doesn't exist")
})