import {FileArray} from "express-fileupload";

export type DefaultAPIResult = {
    ServerError: boolean,
    ClientError: boolean,
    ErrorMessage?: string
}

export type AuthTokenResult = DefaultAPIResult & {
    FirebaseUID?: string
}

export type GetAllItemResult = DefaultAPIResult & {
    ItemList:[]
}

export type FileUploadData = FileArray|undefined|null

