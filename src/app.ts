import log from './log'
import { NODE_ENV } from './env'
import { runTwitterSetup } from './bot'

run()

async function run() {
    log.info(`Running in ${NODE_ENV}`)

    // Setup Twitter Bot
    log.info(`Setting up Twitter Bot`)
    await runTwitterSetup()

    log.complete('All checks complete.')

    // Start Checking The Time
    setInterval(checkToTweet, 60)
}

function checkToTweet() {
    // Is the current time XX:00 minutes?
    const date = new Date()
    if (date.getMinutes() == 0) {
        return
    }
}

function getImageData() {

}

function tweet() {
    
}