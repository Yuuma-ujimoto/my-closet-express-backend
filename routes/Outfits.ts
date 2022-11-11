import {Request, Response, Router} from "express";
import {AuthToken} from "../middleware/AuthToken";
import {Connection, createConnection} from "mysql2/promise";
import {mysqlSetting} from "../config/mysql";
import {AuthTokenResult, DefaultAPIResult, GetOutfitListResult, GetOutfitResult} from "../Types";
import {SaveImage} from "../middleware/SaveImage";


const outfitRouter = Router()


// Outfit追加
outfitRouter.post("/",
    async (req: Request, res: Response) => {
        const AuthResult = await AuthToken(req)
        const FirebaseUID = AuthResult.FirebaseUID
        if (AuthResult.ServerError || AuthResult.ClientError || !FirebaseUID) {
            res.json(AuthResult)
            return
        }
        const {itemId = null, outfitName = null, outfitDescription = null} = req.body
        if (!itemId || !outfitName) {
            res.status(200).json({
                ServerError: false,
                ClientError: true,
                ErrorMessage: "パラメーター不足"
            } as DefaultAPIResult)
        }

        const files: any = req.files
        const {outfitImage} = files


        const connection = await createConnection(mysqlSetting)
        try {

            const SaveOutfitImageURL = await SaveImage(outfitImage, "outfit")

            const InsertOutfitSQL = "insert into outfits(outfit_name, user_id, outfit_description,outfit_image_url) VALUES (?,?,?,?)"
            const [InsertOutfitResult,]: any = await connection.query(InsertOutfitSQL, [outfitName, FirebaseUID, outfitDescription, SaveOutfitImageURL])
            const outfitId = InsertOutfitResult.insertId

            const outFitItemArray = Array.isArray(itemId) ? itemId : [itemId]
            for (const outfitItem of outFitItemArray) {
                const InsertOutfitItemSQL = "insert into outfitItems(outfit_id, item_id, user_id) VALUES (?,?,?)"
                await connection.query(InsertOutfitItemSQL, [outfitId, outfitItem, FirebaseUID])
            }
            res.json({
                ServerError: false,
                ClientError: false
            } as DefaultAPIResult)
        } catch (error) {
            console.log(error)
            res.status(500).json({
                ServerError: true,
                ClientError: false,
                ErrorMessage: "サーバーエラー"
            } as DefaultAPIResult)
        } finally {
            await connection.end()
        }
    })

//　Outfit取得
outfitRouter.get("/", async (req: Request, res: Response) => {
    const AuthResult = await AuthToken(req)
    const FirebaseUID = AuthResult.FirebaseUID
    if (AuthResult.ServerError || AuthResult.ClientError || !FirebaseUID) {
        res.json(AuthResult)
        return
    }
    const connection: Connection = await createConnection(mysqlSetting)
    try {
        const SelectOutfitSQL = "select outfit_id,outfit_name,outfit_image_url from outfits  where user_id = ? and is_deleted = 0"
        const [SelectOutfitResult,] = await connection.query(SelectOutfitSQL, [FirebaseUID])

        res.json({
            ServerError: false,
            ClientError: false,
            OutfitList: SelectOutfitResult
        } as GetOutfitListResult)

    } catch (error) {
        console.log(error)

        res.status(500).json({
            ServerError: true,
            ClientError: false,
            ErrorMessage: "サーバーエラー"
        } as DefaultAPIResult)
    }
})


outfitRouter.get("/:outfitId", async (req, res) => {
    const AuthResult: AuthTokenResult = await AuthToken(req)
    const FirebaseUID = AuthResult.FirebaseUID
    if (AuthResult.ServerError || AuthResult.ClientError || !FirebaseUID) {
        res.json(AuthResult)
        return
    }
    const {outfitId = null} = req.params
    if (!outfitId) {
        res.json({
            ServerError: false,
            ClientError: true,
            ErrorMessage: "パラメーターエラー"
        } as DefaultAPIResult)
        return
    }

    const connection = await createConnection(mysqlSetting)
    try {
        const SelectOutfitStatusSQL = "select outfit_id,outfit_name,outfit_image_url,outfit_description from outfits where outfit_id = ? and user_id = ? and is_deleted = 0"

        const [SelectOutfitStatusResult,]: any = await connection.query(SelectOutfitStatusSQL, [outfitId, FirebaseUID])
        const OutfitId = SelectOutfitStatusResult[0].outfit_id

        const SelectOutfitItemSQL = "select I.item_id,I.item_image_url,I.item_name,I.item_color,B.bland_name,B.bland_id,SC.sub_category_id,SC.sub_category_name,MC.main_category_id,MC.main_category_name from items I inner join subCategories SC on I.item_category_id = SC.sub_category_id inner join mainCategories MC on MC.main_category_id = SC.main_category_id inner join outfitItems OI on I.item_id = OI.item_id inner join blands B on B.bland_id = I.bland_id where OI.outfit_id = ?"
        const [SelectOutfitItemResult,]: any = await connection.query(SelectOutfitItemSQL, [OutfitId])

        res.json({
            ServerError: false,
            ClientError: false,
            OutfitData: SelectOutfitStatusResult,
            ItemData: SelectOutfitItemResult
        } as GetOutfitResult)

    } catch (error) {
        console.log(error)
        res.status(500).json({
            ServerError: true,
            ClientError: false,
            ErrorMessage: "サーバーエラー"
        } as DefaultAPIResult)
    } finally {
        await connection.end()
    }

})

export default outfitRouter
