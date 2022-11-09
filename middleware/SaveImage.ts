import {UploadedFile} from "express-fileupload"

type ImageFileType = "item" | "outfit"

export const SaveImage = async function (ImageData: UploadedFile, ImageType: ImageFileType):Promise<string> {
    const SplitFileName = ImageData.name.split(".")
    const FileExtend = SplitFileName[SplitFileName.length - 1]
    const FileName = `${ImageType}/${ImageData.md5}.${FileExtend}`
    const MoveFilePath = `./files/${FileName}`
    await ImageData.mv(MoveFilePath)

    return `http://localhost:8888/${FileName}`


}
