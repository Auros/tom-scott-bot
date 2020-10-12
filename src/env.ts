import dotenv from 'dotenv'
import log, { fail } from './log'

dotenv.config()

export const NODE_ENV = process.env.NODE_ENV as string

const required = ['GOOGLE_CSE_ID', 'GOOGLE_API_KEY', 'TWITTER_CONSUMER_KEY', 'TWITTER_CONSUMER_SECRET', 'TWITTER_ACCESS_TOKEN', 'TWITTER_ACCESS_SECRET'] 

try {
    for (const variable of required) {
      if (!process.env[variable]) throw new Error(variable)
    }
  } catch (err) {
    fail(`Environment variable missing: ${err.message}`)
  }

export const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID as string
if (GOOGLE_CSE_ID === undefined) {
    fail(`GOOGLE_CSE_ID is not defined.`)
}

export const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY as string
if (GOOGLE_API_KEY === undefined) {
    fail(`GOOGLE_API_KEY is not defined.`)
}

export const TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY as string
if (TWITTER_CONSUMER_KEY === undefined) {
    fail(`TWITTER_CONSUMER_KEY is not defined.`)
}

export const TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET as string
if (TWITTER_CONSUMER_SECRET === undefined) {
    fail(`TWITTER_CONSUMER_SECRET is not defined.`)
}

export const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN as string
if (TWITTER_ACCESS_TOKEN === undefined) {
    fail(`TWITTER_ACCESS_TOKEN is not defined.`)
}

export const TWITTER_ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET as string
if (TWITTER_ACCESS_SECRET === undefined) {
    fail(`TWITTER_ACCESS_SECRET is not defined.`)
}