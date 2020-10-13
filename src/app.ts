import log from './log'
import { NODE_ENV } from './env'
import { randomPlace, generateImage } from './image-gen'
import { runTwitterSetup, submitScott, uploadImage } from './bot'

run()

async function run() {
    log.info(`Running in ${NODE_ENV}`)

    // Setup Twitter Bot
    log.info(`Setting up Twitter Bot`)
    await runTwitterSetup()

    log.complete('All checks complete.')

    // Start Checking The Time
    setInterval(checkToTweet, 1000 * 60)
}

function checkToTweet() {
    // Is the current time XX:00 minutes?
    const date = new Date()
    if (date.getMinutes() == 0) {
        tweetScott()
        return
    }
}

async function tweetScott() {
    const ran = randomPlace()
    const img = (await generateImage(ran)).toString('base64')
    const upl = await uploadImage(img)
    await submitScott(ran, upl.media_id_string)
}