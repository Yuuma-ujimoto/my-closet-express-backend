import {Request, Response, Router} from "express";
import {AuthToken} from "../middleware/AuthToken";
import {AuthTokenResult, DefaultAPIResult} from "../Types";
import {Connection, createConnection} from "mysql2/promise";
import {mysqlSetting} from "../config/mysql";

const blandRouter = Router()


blandRouter.get("/", async (req: Request, res: Response) => {
    const AuthResult: AuthTokenResult = await AuthToken(req)
    if (AuthResult.ServerError || AuthResult.ClientError || !AuthResult.FirebaseUID) {
        res.json(AuthResult)
        return
    }

    const connection: Connection = await createConnection(mysqlSetting)
    try {
        const SelectUsedITemBland = "select B.bland_name,B.bland_id from blands B inner join items I on B.bland_id = I.bland_id where I.user_id = ? GROUP BY B.bland_id"

    } catch (error) {
        console.log(error)
        res.json(
            {
                ServerError: true,
                ClientError: false,
                ErrorMessage: "サーバーエラー"
            } as DefaultAPIResult
        )
    }
})


blandRouter.post("/favorite", async (req: Request, res: Response) => {
    const AuthResult: AuthTokenResult = await AuthToken(req)
    if (AuthResult.ServerError || AuthResult.ClientError || !!AuthResult.ErrorMessage) {
        res.json(AuthResult)
    }

    const {bland_id = null} = req.body
    if (!bland_id) {
        res.json({
            ServerError: false,
            ClientError: true,
            ErrorMessage: "パラメーター不足"
        } as DefaultAPIResult)
        return
    }
    const user_id = AuthResult.FirebaseUID
    const connection: Connection = await createConnection(mysqlSetting)
    try {
        const CheckExistBlandSQL = "select count(*) as count from blands where bland_id = ? and is_deleted = 0"
        const [CheckExistBlandResult,]: any = await connection.query(CheckExistBlandSQL, [bland_id])

        if (!CheckExistBlandResult[0].count) {
            res.json({
                ServerError: false,
                ClientError: true,
                ErrorMessage: "パラメーターに誤りがあります"
            } as DefaultAPIResult)
            return
        }

        const GetFavoriteBlandStatusSQL = "select is_deleted as count from favoriteBlands where bland_id = ? and user_id = ?"
        const [CheckAlreadyFavoriteBlandResult,]: any = await connection.query(GetFavoriteBlandStatusSQL, [bland_id, user_id])
        // null insert
        // 0 already inserted ->
        // 1 already deleted -> update

        switch (CheckAlreadyFavoriteBlandResult[0].count) {
            case null:
                const InsertFavoriteBlandSQL = "insert into favoriteBlands(bland_id, user_id) values (?,?)"
                await connection.query(InsertFavoriteBlandSQL, [bland_id, user_id])
                break;
            case 0:
                res.json({
                    ServerError: false,
                    ClientError: true,
                    ErrorMessage: "既に登録済みです"
                } as DefaultAPIResult)
                return
            case 1:
                const UpdateFavoriteBlandSQL = "update favoriteBlands set is_deleted = 0 and updated_at = current_timestamp where bland_id = ? and user_id = ?"
                await connection.query(UpdateFavoriteBlandSQL, [bland_id, user_id])
                break;
            default:
                res.json(
                    {
                        ServerError: true,
                        ClientError: false,
                        ErrorMessage: "サーバーエラー"
                    } as DefaultAPIResult)
                return

        }
        // nullと1の場合のみSwitch文を通過
        res.json({
            ServerError: false,
            ClientError: false
        } as DefaultAPIResult)

    } catch (error) {
        console.log(error)
        res.json({
            ServerError: true,
            ClientError: false,
            ErrorMessage: "サーバーエラー"
        } as DefaultAPIResult)
    } finally {
        await connection.end()
    }

})


export default blandRouter
