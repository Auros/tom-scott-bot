import log, { fail } from '../log'
import { TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET } from '../env'
import Twitter from 'twitter-lite'

const client = new Twitter({
    consumer_key: TWITTER_CONSUMER_KEY,
    consumer_secret: TWITTER_CONSUMER_SECRET,
    access_token_key: TWITTER_ACCESS_TOKEN,
    access_token_secret: TWITTER_ACCESS_SECRET
})

export async function runTwitterSetup() {
    // Verify Connection
    log.await('Verifying Credentials...')
    try {
        let verifyBody = await client.get('account/verify_credentials')
        log.success('Account Verified')
        log.note(`Name: ${verifyBody.name}`)
        log.note(`ID: ${verifyBody.id_str}`)
        log.note(`Followers: ${verifyBody.followers_count}`)
    }
    catch {
        fail('Could not verify the twitter account. Make sure the access token and access secret are correct.')
    }
    log.success('Twitter Bot Running')
}