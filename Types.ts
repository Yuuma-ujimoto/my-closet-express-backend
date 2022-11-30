import {FileArray} from "express-fileupload";

// :MEMO: エラーメッセージ用の型を作っておくけど使うかは未定　
type ErrorMessage  = "パラメーター不足"|"サーバーエラー"|"認証エラー"|"ファイルエラー"|"パラメーターに誤りがあります"|"既に登録済みです"

export type DefaultAPIResult = {
    ServerError: boolean,
    ClientError: boolean,
    ErrorMessage?: ErrorMessage
}

export type SignInResult = DefaultAPIResult & {
    UserName:string
}

export type GetItemStatusResult = DefaultAPIResult &{
    ItemInfo:[]
}

export type AuthTokenResult = DefaultAPIResult & {
    FirebaseUID?: string
}

export type GetAllItemResult = DefaultAPIResult & {
    ItemList:[]
}

export type GetMainCategoryResult = DefaultAPIResult & {
    MainCategoryList :[],
    SubCategoryList:[]
}

export type GetOutfitListResult = DefaultAPIResult & {
    OutfitList:[]
}

export type GetOutfitResult = DefaultAPIResult &{
    OutfitData:[],
    ItemData:[]
}

export type GetSubCategoryResult = DefaultAPIResult & {
    SubCategoryData:[]
}

export type FileUploadData = FileArray|undefined|null

