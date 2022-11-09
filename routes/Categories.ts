import {Router} from "express";
import {createConnection} from "mysql2/promise";
import {mysqlSetting} from "../config/mysql";
import {DefaultAPIResult} from "../Types";


const categoryRouter = Router()

categoryRouter.get("/main", async (req, res) => {
    const connection = await createConnection(mysqlSetting)
    try {
        const SelectMainCategorySQL = "select main_category_id, main_category_name from mainCategories where is_deleted = 0"
        const [SelectMainCategoryResult,]:any = await connection.query(SelectMainCategorySQL)
        const responseBody = {
            ServerError: false,
            ClientError: false,
            MainCategoryList:SelectMainCategoryResult
        }
        res.json(responseBody)
    } catch (error) {
        console.log(error)
        const responseBody: DefaultAPIResult = {
            ServerError: true,
            ClientError: false,
            ErrorMessage: "サーバーエラー"
        }
        res.json(responseBody)
    } finally {
        await connection.end()
    }
})

categoryRouter.get("/sub/:mainCategoryId",async (req, res) => {
    const mainCategoryId = req.params.mainCategoryId
    if (!mainCategoryId){
        const responseBody = {
            ServerError:false,
            ClientError:true,
            ErrorMessage: "パラメーター不足"
        }
        res.json(responseBody)
    }
})

export default categoryRouter
