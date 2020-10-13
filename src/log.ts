import { Signale } from '@lolpants/signale'

const signale = new Signale({
    config: {
        displayDate: true,
        displayTimestamp: true
    }
})

export const fail = (message: string) => {
    signale.fatal(message)
    return process.exit(1)
}

export default signale