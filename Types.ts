import {FileArray} from "express-fileupload";

export type DefaultAPIResult = {
    ServerError: boolean,
    ClientError: boolean,
    ErrorMessage?: string
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
    MainCategoryList :[]
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

