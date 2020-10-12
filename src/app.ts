import log from './log'

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