import {Request} from "express";
import {getAuth} from "firebase-admin/auth";
import {AuthTokenResult} from "../Types";


export async function AuthToken(req: Request): Promise<AuthTokenResult> {
    const authorization = req.header("Authorization")
    if (!authorization) {
        return {
            ServerError: false,
            ClientError: false,
            ErrorMessage: "Token Error"
        }
    }
    const AccessToken = authorization.split(" ")[1]
    try {
        const firebaseUser = await getAuth().verifyIdToken(AccessToken)
        return {
            ServerError: false,
            ClientError: false,
            FirebaseUID: firebaseUser.uid
        }
    } catch (error) {
        console.log(error)
        return {
            ServerError: true,
            ClientError: false,
            ErrorMessage: "Server Error"
        }
    }
}
