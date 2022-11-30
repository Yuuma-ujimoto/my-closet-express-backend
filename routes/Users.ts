import {Request, Response, Router} from "express";
import {createConnection, Connection} from "mysql2/promise"
import {mysqlSetting} from "../config/mysql";
import {initializeApp, applicationDefault} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {DefaultAPIResult, SignInResult} from "../Types";

const userRouter: Router = Router()


initializeApp({
    credential: applicationDefault(),
})

type userStatus = 0 | 1 | null


// サインイン
userRouter.post("/", async (req: Request, res: Response) => {
    console.log("1")
    const authorization = req.header("Authorization")
    console.log(authorization)
    if (!authorization) {
        res.json({
            ServerError: false,
            ClientError: true,
            ErrorMessage: "認証エラー"
        } as DefaultAPIResult)
        return
    }

    console.log("2")
    const AccessToken = authorization.split(" ")[1]

    const connection: Connection = await createConnection(mysqlSetting)
    try {
        const firebaseUser = await getAuth().verifyIdToken(AccessToken);

        const CheckExistUserSQL = "select is_deleted from users where firebase_uuid = ?"
        const [CheckExistUserResult,]: any = await connection.query(CheckExistUserSQL, [firebaseUser.uid])
        // 0 -> 既にいる
        // 1 -> 退会済みなので新規作成
        // null -> 新規作成
        let user_status: userStatus = null
        if (!!CheckExistUserResult[0]) {
            user_status = CheckExistUserResult[0].is_deleted
        }
        console.log(user_status)

        if (user_status == null) {
            const InsertUserSQL = "insert into users(firebase_uuid, user_name) value(?,?)"
            await connection.query(InsertUserSQL, [firebaseUser.uid, firebaseUser.name])
            const UpdateUserSQL = "update users set is_deleted = 0,updated_at = current_timestamp where firebase_uuid = ?"
            await connection.query(UpdateUserSQL, [firebaseUser.uid])
            res.json({
                ServerError: false,
                ClientError: false,
                UserName: firebaseUser.name
            } as SignInResult)
            return

        }
        if (user_status == 1) {
            const UpdateUserSQL = "update users set is_deleted = 0,updated_at = current_timestamp where firebase_uuid = ?"
            await connection.query(UpdateUserSQL, [firebaseUser.uid])
            res.json({
                ServerError: false,
                ClientError: false,
                UserName: firebaseUser.name
            } as SignInResult)
            return
        }
        if (user_status == 0) {
            const SelectUserNameSQL = "select user_name from users where firebase_uuid = ?"
            const [SelectUserNameResult,]: any = await connection.query(SelectUserNameSQL, [firebaseUser.uid])
            res.json({
                ServerError: false,
                ClientError: false,
                UserName: SelectUserNameResult[0].user_name
            } as SignInResult)
            return
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({
            ServerError: true,
            ClientError: false,
            ErrorMessage: "サーバーエラー"
        } as DefaultAPIResult)
        return

    } finally {
        await connection.end()
    }
})


userRouter.put("/", async (req, res) => {
    const authorization = req.header("Authorization")
    if (!authorization) {
        res.json({
            ServerError: false,
            ClientError: true,
            ErrorMessage: "認証エラー"
        } as DefaultAPIResult)
        return
    }

    const {userName: newUserName = null} = req.body
    if (!newUserName) {
        res.json({
            ServerError: false,
            ClientError: true,
            ErrorMessage: "パラメーター不足"
        } as DefaultAPIResult)
        return
    }
    const AccessToken = authorization.split(" ")[1]


    const connection: Connection = await createConnection(mysqlSetting)
    try {
        const firebaseUser = await getAuth().verifyIdToken(AccessToken)
        const UpdateUserNameSQL = "update users set user_name = ? where firebase_uuid = ?"
        await connection.query(UpdateUserNameSQL, [firebaseUser.uid])
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


export default userRouter
