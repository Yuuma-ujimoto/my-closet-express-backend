import {Request, Response, Router} from "express";
import {AuthTokenResult, DefaultAPIResult, FileUploadData, GetAllItemResult} from "../Types";
import {AuthToken} from "../middleware/AuthToken";
import {Connection, createConnection} from "mysql2/promise";
import {mysqlSetting} from "../config/mysql";
import {UploadedFile} from "express-fileupload";
import {SaveImage} from "../middleware/SaveImage";

const router: Router = Router()

router.post("/", async (req, res) => {
    const AuthTokenResult: AuthTokenResult = await AuthToken(req)
    if (AuthTokenResult.ClientError || AuthTokenResult.ServerError || !AuthTokenResult.FirebaseUID) {
        res.json(AuthTokenResult)
        return
    }

    const {categoryId = null, itemName = null, blandId = null, itemColor = null} = req.body

    const file: FileUploadData = req.files
    if (!file) {
        const responseBody: DefaultAPIResult = {
            ServerError: false,
            ClientError: true,
            ErrorMessage: "ファイルがありません。"
        }
        res.json(responseBody)
        return
    }
    const itemImage = file.itemImage
    if (!itemImage) {
        const responseBody: DefaultAPIResult = {
            ServerError: false,
            ClientError: true,
            ErrorMessage: "不明なファイル"
        }
        res.json(responseBody)
        return
    }
    const ItemImageData: UploadedFile = Array.isArray(itemImage) ? itemImage[0] : itemImage


    const firebaseUid = AuthTokenResult.FirebaseUID
    const connection: Connection = await createConnection(mysqlSetting)
    try {
        // idが存在しない場合は1をデフォルトにする
        let insertBlandId = 1
        if (!blandId) {

            const CheckBlandExistSQL = "select count(*) as count from blands where bland_id = ? and is_deleted = 0"
            const [CheckBlandExistResult,]: any = await connection.query(CheckBlandExistSQL, [blandId])
            if (!!CheckBlandExistResult.count) {
                // IDが一致すれば上書き
                insertBlandId = blandId
            } else {
                const responseBody: DefaultAPIResult = {
                    ServerError: false,
                    ClientError: true,
                    ErrorMessage: "不明なブランド"
                }
                res.json(responseBody)
                return
            }
        }

        const CheckCategoryExistSQL =
            "select count(*) as count from subCategories where sub_category_id = ? and is_deleted = 0"
        const [CheckCtegoryExistResult,]: any = await connection.query(CheckCategoryExistSQL, [categoryId])
        console.log(CheckCtegoryExistResult[0].count)
        if (!CheckCtegoryExistResult[0].count) {
            const responseBody: DefaultAPIResult = {
                ServerError: false,
                ClientError: true,
                ErrorMessage: "存在しないカテゴリー"
            }
            res.json(responseBody)
            return
        }
        const ItemImageFilePath = await SaveImage(ItemImageData, "item")
        const InsertItemSQL =
            "insert into items(item_name, item_image_url, item_category_id, user_id,bland_id,item_color) VALUES (?,?,?,?,?,?)"

        await connection.query(InsertItemSQL, [
            itemName,
            ItemImageFilePath,
            categoryId,
            firebaseUid,
            insertBlandId,
            itemColor
        ])
        const responseBody: DefaultAPIResult = {
            ServerError: false,
            ClientError: false,
        }
        res.json(responseBody)

    } catch (error) {
        console.log(error)
        const responseBody: DefaultAPIResult = {
            ServerError: true,
            ClientError: false,
            ErrorMessage: "サーバーエラー"
        }
        res.status(500).json(responseBody)
    } finally {
        await connection.end()
    }
})


router.get("/", async (req: Request, res: Response) => {
    const authResult: AuthTokenResult = await AuthToken(req)
    const FirebaseUID = authResult.FirebaseUID
    if (authResult.ServerError || authResult.ClientError || !FirebaseUID) {
        res.json(authResult)
        return
    }

    const connection: Connection = await createConnection(mysqlSetting)
    try {
        const SelectMyItemSQL =
            "select I.item_id,I.item_name,I.item_image_url,MC.main_category_name,MC.main_category_id,SC.sub_category_name,SC.sub_category_id from items I inner join subCategories SC on I.item_category_id = SC.sub_category_id inner join mainCategories MC on SC.main_category_id = MC.main_category_id where I.user_id = ?"

        const [SelectMyItemResult,]: any = await connection.query(SelectMyItemSQL, [FirebaseUID])

        const responseBody: GetAllItemResult = {
            ServerError: false,
            ClientError: false,
            ItemList: SelectMyItemResult
        }
        res.json(responseBody)

    } catch (error) {
        console.log(error)
        const responseBody: DefaultAPIResult = {
            ServerError: true,
            ClientError: false,
            ErrorMessage: "サーバーエラー"
        }
        res.status(500).json(responseBody)
    } finally {
        await connection.end()
    }
})


router.get("/:itemId", async (req: Request, res: Response) => {
    const AuthResult = await AuthToken(req)
    const FirebaseUID = AuthResult.FirebaseUID
    if (AuthResult.ClientError || AuthResult.ServerError || !FirebaseUID) {
        res.json(AuthResult)
        return
    }
    const {itemId} = req.params

    if (!itemId){
        const responseBody:DefaultAPIResult = {
            ServerError:false,
            ClientError:true,
            ErrorMessage:"パラメーター不足"
        }
        res.json(responseBody)
        return
    }

    const connection = await createConnection(mysqlSetting)
    try {
        const CheckExistItemSQL = "select count(*) as count from items where user_id = ? and item_id = ? and is_deleted = 0"
        const [CheckExistItemResult,]: any = await connection.query(CheckExistItemSQL)
        if (!CheckExistItemResult[0].count) {
            const responseBody: DefaultAPIResult = {
                ServerError: false,
                ClientError: true,
                ErrorMessage: "アイテムが存在しません。"
            }
            res.json(responseBody)
            return
        }

        const SelectItemInfoSQL =
            "select I.item_id,I.item_name,I.item_image_url,IM.item_memo_text,MC.main_category_name,MC.main_category_id,SC.sub_category_name,SC.sub_category_id from items I inner join subCategories SC on I.item_category_id = SC.sub_category_id inner join mainCategories MC on SC.main_category_id = MC.main_category_id inner join itemMemos IM on I.item_id = IM.item_id where I.item_id = ?"

        const [SelectItemInfoResult,]:any = await connection.query(SelectItemInfoSQL,[itemId])

        const responseBody = {
            ServerError:false,
            ClientError:false,
            ItemInfo:SelectItemInfoResult
        }
        res.json(responseBody)

    } catch (error) {
        console.log(error)
        const responseBody: DefaultAPIResult = {
            ServerError: true,
            ClientError: false,
            ErrorMessage: "サーバーエラー"
        }
        res.status(500).json(responseBody)
    }
    finally {
        await connection.end()
    }
})

export default router
