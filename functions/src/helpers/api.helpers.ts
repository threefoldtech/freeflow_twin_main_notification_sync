const axios = require('axios').default

export interface DigitalTwin {
    'name': string
    'public_key': string
    'app_id': string
}


export const getDerivedPublicKeyByUsername = async (username: string, appId: string): Promise<string | null> => {
    try {
        const res = await axios.get(`https://login.threefold.me/api/users/digitaltwin/${username}`)

        if (!res) {
            console.log(`Could not parse result for Username ${username} with appId ${appId}`)
            return null
        }

        if (!res.data) {
            console.log(`Username ${username} with appId ${appId} does not exist`)
            return null
        }

        let publicKey = null

        res.data.map((dt: DigitalTwin) => {
            if (dt.app_id.toLowerCase() === appId.toLowerCase()) {
                publicKey = dt.public_key
            }
        })

        return publicKey

    } catch (e) {
        console.error(e)
        return null
    }
}
