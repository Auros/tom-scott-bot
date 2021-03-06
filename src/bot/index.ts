import fetch from 'cross-fetch'
import log, { fail } from '../log'
import Twitter, { Stream } from 'twitter-lite'
import { generateImage, CaptionData } from '../image-gen'
import { TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET, ALLOWED_REPLIERS } from '../env'

const client = new Twitter({
    consumer_key: TWITTER_CONSUMER_KEY,
    consumer_secret: TWITTER_CONSUMER_SECRET,
    access_token_key: TWITTER_ACCESS_TOKEN,
    access_token_secret: TWITTER_ACCESS_SECRET
})

const mediaClient = new Twitter({
    subdomain: 'upload',
    consumer_key: TWITTER_CONSUMER_KEY,
    consumer_secret: TWITTER_CONSUMER_SECRET,
    access_token_key: TWITTER_ACCESS_TOKEN,
    access_token_secret: TWITTER_ACCESS_SECRET
})

let stream: Stream | undefined
let mentionName: string = '@tomscott_bot'

const streamParams = {
    track: mentionName
}

export async function runTwitterSetup() {
    // Verify Connection
    log.await('Verifying Credentials...')
    try {
        let verifyBody = await client.get('account/verify_credentials')
        log.success('Account Verified')
        log.info(`Name: ${verifyBody.name}`)
        log.info(`ID: ${verifyBody.id_str}`)
        log.info(`Followers: ${verifyBody.followers_count}`)

        mentionName = `@${verifyBody.screen_name}`
    }
    catch {
        fail('Could not verify the twitter account. Make sure the access token and access secret are correct.')
    }
    setupStream()
    log.success('Twitter Bot Running')
}

async function setupStream() {
    log.await('Setting up filter stream.')
    stream = client.stream('statuses/filter', streamParams)
        .on('start', _ => log.info('Connected to filter stream.'))
        .on('data', tweet => processRequest(tweet))
        .on('error', error => log.error(`An error in the stream has occured: ${error}`))
        .on('end', response => log.await('Destroying Twitter stream...'))

    process.on('exit', (_) => {
        if (stream !== undefined) {
            stream.destroy()
        }
    })
}

async function processRequest(tweet: any) {
    const location = (tweet.text as string).replace(`${mentionName}`, '').trim().replace('.', '')
    if (location === '' || location === null) {
        return
    }
    if (ALLOWED_REPLIERS !== undefined) {
        if (!ALLOWED_REPLIERS.includes((tweet.user.screen_name as string).toLowerCase())) {
            log.info(`${tweet.user.name} (${tweet.user.screen_name}) tried to tweet the bot directly but isn't allowed too!`)
            return
        }
    }
    // Send Request
    log.start('Received request to generate a Tom Scott Image')
    log.info(`Location: ${location}`)
    log.info(`From: ${tweet.user.name} (${tweet.user.screen_name})`)
    
    if (tweet.in_reply_to_status_id !== null) {
        /*log.info('Reply Detected. Checking for image.')
        // TODO: Check for image on the parent tweet.
        
        const parent = await client.get(`statuses/show/${tweet.in_reply_to_status_id}`)
        if (parent.entities["media"] === undefined || parent.entities["media"].length == 0) {
            const url = parent.entities["media"][0]["media_url"]
            const res = await fetch(url)
            
            const parentImage = Buffer.from(await res.arrayBuffer())

            const parentImageObject = await uploadImage()
            const imageData: CaptionData = {
                name: location,
                topText: 'I am at',
                bottomText: ''
            }
            try {
                await client.post('statuses/update', {
                    media_ids: parentImageObject.media_id_string,
                    status: '',
                    auto_populate_reply_metadata: true,
                    in_reply_to_status_id: tweet.id_str
                })
                log.success('Sent Tweet')
            }
            catch (e) {
                console.log(e)
                log.error(`Failed to send tweet.`)
            }
        }*/
        // TODO: Run the image into image-gen
    }
    else {
        log.info('Not a reply, handling request normally.')
        const imageData: CaptionData = {
            name: location,
            topText: 'I am at',
            bottomText: ''
        }
        const b64Image = await generateImage(imageData)
        const image = await uploadImage(b64Image.toString('base64'))
        try {
            await client.post('statuses/update', {
                status: '',
                media_ids: image.media_id_string,
                auto_populate_reply_metadata: true,
                in_reply_to_status_id: tweet.id_str,
            })
            log.success('Sent Tweet')
        }
        catch (e) {
            console.log(e)
            log.error(`Failed to send tweet.`)
        }
    }
}

export async function submitScott(data: CaptionData, imageId: string) {
    try {
        await client.post('statuses/update', {
            status: '',
            media_ids: imageId,
            auto_populate_reply_metadata: true
        })
        log.success('Sent Tweet')
    }
    catch (e) {
        console.log(e)
        log.error(`Failed to send tweet.`)
    }
}

export async function uploadImage(b64Image: string) {
    let image: any | undefined
    // Upload Image
    try {
        if (b64Image !== null) {
            image = await mediaClient.post('media/upload', {
                media: b64Image
            })
        }
        else {
            log.error('No Image Found')
        }
    }
    catch (e) {
        console.log(e)
        log.error('Failed to upload image.')
    }
    return image
}