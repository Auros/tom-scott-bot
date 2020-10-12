import fs from 'fs'
import log, { fail } from '../log'
import Twitter, { Stream } from 'twitter-lite'
import { TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET } from '../env'

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
    const location = (tweet.text as string).replace(`${mentionName}`, '').trim()
    if (location === '' || location === null) {
        return
    }
    // Send Request
    log.start('Received request to generate a Tom Scott Image')
    log.info(`Location: ${location}`)
    log.info(`From: ${tweet.user.name} (${tweet.user.screen_name})`)
    
    if (tweet.in_reply_to_status_id !== null) {
        log.info('Reply Detected. Checking for image.')
        // TODO: Check for image on the parent tweet.
        // TODO: Run the image into image-gen
        const b64Image = fs.readFileSync('C:/Users/Auros/Documents/Programming/Web Stuff/tom-scott-bot/src/bot/tom_scott.png', { encoding: 'base64' })
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

        try {
            await client.post('statuses/update', {
                media_ids: image.media_id_string,
                status: `Welcome to ${location}`,
                auto_populate_reply_metadata: true,
                in_reply_to_status_id: tweet.id_str
            })
            log.success('Sent Tweet')
        }
        catch (e) {
            console.log(e)
            log.error(`Failed to send tweet.`)
        }
    }
    else {
        log.info('Not a reply, handling request normally.')
        try {
            await client.post('statuses/update', {
                status: `Welcome to ${location}`,
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