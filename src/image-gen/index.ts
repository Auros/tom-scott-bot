import fs from 'fs'
import log from '../log'
import GoogleImages from 'google-images'
import { GOOGLE_CSE_ID, GOOGLE_API_KEY } from '../env'
import { createCanvas, loadImage, registerFont, CanvasRenderingContext2D, Image } from 'canvas'


const imageClient = new GoogleImages(GOOGLE_CSE_ID, GOOGLE_API_KEY)
registerFont(`${__dirname}/../../fonts/impact.ttf`, { family: 'Impact Regular' })

export interface CaptionData {
    name: string
    topText: string
    bottomText: string
}

interface PlaceData {
    data: string[]
    top_text: string
    text: string
}

interface ImageSize {
    width: number
    height: number
}

enum TextType {
    Bottom,
    Top
}

function findBestImage(aspectRatio: number, imageArray: any[]){
    let bestImage = {url: "", variation: 0, width: 0, height: 0}
    for (let i = 0; i < imageArray.length; i++) {
        const image = imageArray[i]
        const imageRatio = image.width/image.height
        const variation = Math.abs(aspectRatio-imageRatio)
        if(bestImage.variation == 0 || variation < bestImage.variation || (variation == bestImage.variation && image.width > bestImage.width)) {
            bestImage.url = image.url
            bestImage.width = image.width
            bestImage.height = image.height
            bestImage.variation = variation
        }
    }
    return bestImage
}

function ctxWithText(ctx: CanvasRenderingContext2D, text: string, textType: TextType, ImageSize: ImageSize, textOffset?: number) : CanvasRenderingContext2D {
    ctx.font = "150px Impact"
    ctx.fillStyle = "white"
    ctx.strokeStyle = "black"
    ctx.lineWidth = 16
    ctx.lineJoin = "round"

    text = text.toUpperCase()
    if(!textOffset) textOffset = 25
    // scuffed text scaling
    if(ctx.measureText(text).width > ImageSize.width - ctx.lineWidth*2){
        const widthModifier = (ImageSize.width - ctx.lineWidth*2)/ctx.measureText(text).width
        const newFontSize = (150*widthModifier) - .05*(150*widthModifier)
        ctx.font = `${newFontSize}px Impact`
        ctx.lineWidth = (16*widthModifier) - .05*(16*widthModifier)
    }
    if(textType == TextType.Top){
        ctx.strokeText(text, (ImageSize.width-ctx.measureText(text).width)/2, ctx.measureText(text).actualBoundingBoxAscent + textOffset)
        ctx.fillText(text, (ImageSize.width-ctx.measureText(text).width)/2, ctx.measureText(text).actualBoundingBoxAscent + textOffset)
    }else if(textType == TextType.Bottom){
        ctx.strokeText(text, (ImageSize.width-ctx.measureText(text).width)/2, ImageSize.height - textOffset)
        ctx.fillText(text, (ImageSize.width-ctx.measureText(text).width)/2, ImageSize.height - textOffset)
    }
    return ctx
}

function random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) ) + min
}

function findTomScottImage() : Promise<typeof Image>{
    //temporarily pull away tom from one of his videos so we can forcibly take a picture of him
    return new Promise((resolve, reject) => {
        fs.readdir(`${__dirname}/../../images/`, (_, files: string[]) => {
            const imagePath = files[random(0, files.length - 1)]
            loadImage(`${__dirname}/../../images/${imagePath}`).then((loadedImage: any) => {
                resolve(loadedImage)
            })
        })
    })
}

function mirrorImage(ctx: CanvasRenderingContext2D, image: any, horizontal: boolean = false, vertical: boolean = false) : CanvasRenderingContext2D{
    ctx.save()  // save the current canvas state
    ctx.setTransform(
        horizontal ? -1 : 1, 0, // set the direction of x axis
        0, vertical ? -1 : 1,   // set the direction of y axis
        0 + (horizontal ? image.width : 0), // set the x origin
        0 + (vertical ? image.height : 0)   // set the y origin
    )
    ctx.drawImage(image,0,0)
    ctx.restore() // restore the state as it was when this function was called
    return ctx
}

function drawExtrasOnCanvas(canvas: any, ImageSize: ImageSize, captionData: CaptionData) : Promise<Buffer> {
    return new Promise((resolve, reject) => {
        let ctx = canvas.getContext('2d')

        findTomScottImage().then(tomScottImage => {
            if(Math.random() > 0.5){
                ctx.drawImage(tomScottImage, 0, 0, ImageSize.width, ImageSize.height)
            }else{
                ctx = mirrorImage(ctx, tomScottImage, true, false) // mirror tom scott
            }
            ctx = ctxWithText(ctx, captionData.topText, TextType.Top, ImageSize)
            ctx = ctxWithText(ctx, `${captionData.bottomText} ${captionData.name}`, TextType.Bottom, ImageSize)

            const bufferedCanvas = canvas.toBuffer()
            // only enable this bit if you want to have an image saved to disk for testing purposes
            // fs.writeFileSync('testimg.png', bufferedCanvas)
            resolve(bufferedCanvas)
        })
    })

}

export function randomPlace() : CaptionData {
    const allPlaces = JSON.parse(fs.readFileSync(`${__dirname}/../../data/amazing-places.json`, { encoding: 'utf-8' }))
    const CaptionDataArray: CaptionData[] = []
    for (let i = 0; i < Object.keys(allPlaces).length; i++) {
        const placeData: PlaceData = Object.values(allPlaces)[i] as PlaceData
        const data = placeData.data
        for (let j = 0; j < data.length; j++) {
            CaptionDataArray.push({name: data[j], topText: placeData.top_text, bottomText: placeData.text})
        }
    }
    return CaptionDataArray[random(0, CaptionDataArray.length - 1)]
}

const ImageSize: ImageSize = {width: 1920, height: 1080}

export function tomScottOnBackground(captionData: CaptionData, loadedImage: any) : Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const canvas = createCanvas(ImageSize.width, ImageSize.height)
        let ctx = canvas.getContext('2d')
        //ctx.drawImage(image, 50, 0, 70, 70)
        const minRatio = (ImageSize.width/loadedImage.width > ImageSize.height/loadedImage.height) ? ImageSize.width/loadedImage.width : ImageSize.height/loadedImage.height // this hurts to look at
        ctx.drawImage(loadedImage, (ImageSize.width-loadedImage.width*minRatio)/2, (ImageSize.height-loadedImage.height*minRatio)/2, loadedImage.width*minRatio, loadedImage.height*minRatio) // this hurts more though
        resolve(drawExtrasOnCanvas(canvas, ImageSize, captionData))
    })
}

export function generateImage(captionData: CaptionData = randomPlace(), imageBuffer?: Buffer) : Promise<Buffer> {
    return new Promise((resolve, reject) => {
        if(imageBuffer){
            // buffer to image
            const img = new Image()
            img.onload = () => { resolve(tomScottOnBackground(captionData, img)) };
            img.onerror = err => { log.error(err.message); reject(err) }
            img.src = imageBuffer;
        }else{
            imageClient.search(captionData.name, {size:"large"}).then((images: any) => {
                const image = findBestImage(ImageSize.width/ImageSize.height, images)
                loadImage(image.url).then((loadedImage: any) => {
                    resolve(tomScottOnBackground(captionData, loadedImage))
                }).catch((error: Error) => {
                    log.error(error.message)
                    reject(error)
                })
            }).catch((error: Error) => {
                log.error(error.message)
                reject(error)
            })    
        }
    })
}