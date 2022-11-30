import {Router} from "express";
import {Connection, createConnection} from "mysql2/promise";
import {mysqlSetting} from "../config/mysql";
import {DefaultAPIResult, GetMainCategoryResult, GetSubCategoryResult} from "../Types";


const categoryRouter = Router()

// Get all
categoryRouter.get("/", async (req, res) => {
    const connection = await createConnection(mysqlSetting)
    try {
        const SelectMainCategorySQL = "select main_category_id, main_category_name from mainCategories where is_deleted = 0"
        const [SelectMainCategoryResult,]: any = await connection.query(SelectMainCategorySQL)

        const SelectSubCategorySQL = "select sub_category_id,sub_category_name,main_category_id from subCategories where is_deleted = 0 order by main_category_id"
        const [SelectSubCategoryResult,]:any = await connection.query(SelectSubCategorySQL)

        const subCategoryList:any = []

        for (const subCategoryData of SelectSubCategoryResult){
            const subCategoryListIndex = subCategoryData.main_category_id
            if (!subCategoryList[subCategoryListIndex]){
                subCategoryList[subCategoryListIndex] = [subCategoryData]
            }
            else {
                console.log(subCategoryList[subCategoryListIndex])
                subCategoryList[subCategoryListIndex] = [...subCategoryList[subCategoryListIndex],subCategoryData]
            }
        }


        res.json({
            ServerError: false,
            ClientError: false,
            MainCategoryList: SelectMainCategoryResult,
            SubCategoryList:subCategoryList
        } as GetMainCategoryResult)
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


// 対応するサブカテゴリーを取得
categoryRouter.get("/:mainCategoryId", async (req, res) => {
    const mainCategoryId = req.params.mainCategoryId
    if (!mainCategoryId) {
        res.status(200).json({
            ServerError: false,
            ClientError: true,
            ErrorMessage: "パラメーター不足"
        })
    }
    const connection:Connection = await createConnection(mysqlSetting)
    try {
        const SelectSubCategoryDataSQL = "select sub_category_name,sub_category_id from subCategories where main_category_id = ? and is_deleted = 0"
        const [SelectSubCategoryDataResult,]:any = await connection.query(SelectSubCategoryDataSQL,[mainCategoryId])

        res.json({
            ServerError:false,
            ClientError:false,
            SubCategoryData:SelectSubCategoryDataResult
        } as GetSubCategoryResult)

    }catch (error){
        console.log(error)
        res.status(500).json({
            ServerError:true,
            ClientError:false,
            ErrorMessage:"サーバーエラー"
        }as DefaultAPIResult)
    }
})

export default categoryRouter
