import express, {json, urlencoded} from "express"
import expressFileUpload from "express-fileupload"

import cors from "cors"
import {FileUploadData} from "./Types";
const app = express()
app.use(expressFileUpload())
app.use(express.static("./files"))
app.use(json())
app.use(urlencoded({extended: true, limit: "50mb"}))
app.use(cors({
    origin: "http://localhost:8080"
}))


app.use((req, res, next) => {
    // request log
    console.log(req.path)
    console.log(req.body)
    console.log("-------")
    next()
})

app.post("/a", (req, res) => {
    const file:FileUploadData = req.files
    if (!!file) console.log(file.itemImage)

    res.json({})
})


import userRouter from "./routes/Users"
app.use("/users", userRouter)

import itemRouter from "./routes/Items"
app.use("/items",itemRouter)

import outfitRouter from "./routes/Outfits";
app.use("/outfits",outfitRouter)

import categoryRouter from "./routes/Categories";
app.use("/categories",categoryRouter)

app.listen(8888, () => {
    console.log("Server Running")
})
