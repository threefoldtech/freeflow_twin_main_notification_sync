import { sign } from 'tweetnacl'
import { decodeBase64 } from 'tweetnacl-util'

export const validateSign = async (data: Object, signature: string, publicKey: string): Promise<boolean> => {
    return sign.detached.verify(
        objectToUint8Array(data),
        base64ToUint8Array(signature),
        decodeBase64(publicKey),
    )
}

const objectToBase64 = (data: unknown): string => {
    return Buffer.from(JSON.stringify(data)).toString('base64')
}
const base64ToUint8Array = (base64: string): Uint8Array => {
    return new Uint8Array(decodeBase64(base64))
}

const objectToUint8Array = (data: unknown): Uint8Array => {
    return base64ToUint8Array(objectToBase64(data))
}
