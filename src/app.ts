import log from './log'
import { NODE_ENV } from './env'

log.info(`Running in ${NODE_ENV}`)

// Setup Twitter Bot


setInterval(checkToTweet, 60)

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