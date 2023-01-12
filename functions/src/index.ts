import * as functions from 'firebase-functions'
import { Request, Response } from 'firebase-functions'
import { getDerivedPublicKeyByUsername } from './helpers/api.helpers'
import { validateSign } from './helpers/crypto.helpers'
import { v4 as uuid } from 'uuid'

const { cert } = require('firebase-admin/app')
const { Datastore } = require('@google-cloud/datastore')
const serviceAccount = require('../service-account.json')
const app = require('express')()


const admin = require('firebase-admin')
const fcm = require('fcm-notification')

const certPath = admin.credential.cert(serviceAccount)
const FCM = new fcm(certPath)

export enum Headers {
    JIMBER_HEADER = 'jimber-authorization'
}

export interface NotificationItem {
    timestamp: string;
    message: string;
    sender: string;
    group: string;
    me: string;
    appId: string;
}

admin.initializeApp({ credential: cert(serviceAccount) })

const db = new Datastore(admin)

app.get('/:username/:appId/identifier', async (req: Request, res: Response) => {
    const username = req.params.username
    const appId = req.params.appId;

    if(username == null || appId == null) {
        console.log('username or appid null')
        return res.status(400).json({'status' : 'username or appid null'})
    }


    if (!req.headers[Headers.JIMBER_HEADER] || !req.headers[Headers.JIMBER_HEADER]) {
        console.log('No Jimber header present')
        return res.status(400).json({'status': 'no jimber header present'})
    }

    const signedAuthorization: string = req.headers[Headers.JIMBER_HEADER] as string
    console.log('This is the signed authorization: ', signedAuthorization)

    const derivedPublicKey = await getDerivedPublicKeyByUsername(username, appId)
    console.log(`Derived key for user: ${username} : `, derivedPublicKey)
    if (derivedPublicKey == null) {
        console.log(`Could not find public key for user ${username} with appId ${appId}`)
        return res.status(404).json({'status': 'no public key found for given user'})
    }

    const header = { 'intention': 'retrieve-identifier' }
    const verifiedAuthorization = await validateSign(header, signedAuthorization, derivedPublicKey)
    if (verifiedAuthorization == null) {
        console.log('Could not verify the headers')
        return res.status(400).json({'status': 'could not verify headers'})
    }

    const query = db.createQuery('Identifiers').filter('appId', '=', appId).filter('username', '=', username).limit(1)
    const [identifiers] = await db.runQuery(query)

    if(identifiers.length == 0) {
        return res.status(404).json({'status': 'identifier not found'})
    }

    return res.status(200).json({'identifier' : identifiers[0]['identifier']})
})


app.post('/identify', async (req: Request, res: Response) => {
    const body = req.body

    if (!body['username'] || !body['appId'] || !body['identifier']) {
        console.log(`Not all required parameters are inside the body: `, body)
        return res.status(400).json({'status': 'not all required parameters are inside the body'})
    }

    const username = body['username']
    const appId = body['appId']
    const identifier = body['identifier']


    if (!req.headers[Headers.JIMBER_HEADER] || !req.headers[Headers.JIMBER_HEADER]) {
        console.log('No Jimber header present')
        return res.status(400).json({'status': 'no jimber header present'})
    }

    const signedAuthorization: string = req.headers[Headers.JIMBER_HEADER] as string
    console.log('This is the signed authorization: ', signedAuthorization)

    const derivedPublicKey = await getDerivedPublicKeyByUsername(username, appId)
    console.log(`Derived key for user: ${username} : `, derivedPublicKey)
    if (derivedPublicKey == null) {
        console.log(`Could not find public key for user ${username} with appId ${appId}`)
        return res.status(404).json({'status': 'no public key found for given user'})
    }

    const header = { 'intention': 'retrieve-identifier' }
    const verifiedAuthorization = await validateSign(header, signedAuthorization, derivedPublicKey)
    if (verifiedAuthorization == null) {
        console.log('Could not verify the headers')
        return res.status(400).json({'status': 'could not verify headers'})
    }

    const query = db.createQuery('Identifiers').filter('appId', '=', appId).filter('username', '=', username).limit(1)
    const [identifiers] = await db.runQuery(query)

    if (identifiers.length == 0) {
        const kind: string = 'Identifiers'
        const usernameKey = db.key([kind, uuid()])

        const identity = {
            key: usernameKey,
            data: {
                username: username,
                appId: appId,
                identifier: identifier,
            },
        }

        await db.save(identity)
        console.log(`Saved ${identity.key.name}: ${identity.data.identifier}`)

        return res.status(201).json({'status': 'successfully created identifier'})
    }

    identifiers[0].username = username
    identifiers[0].appId = appId
    identifiers[0].identifier = identifier

    await db.update(identifiers[0])
    console.log(`Updated ${username} : ${identifier}`)

    return res.send(204).json({'status': 'successfully updated identifier'})
})

app.post('/notification', async (req: Request, res: Response) => {
    const body = req.body

    if (!body['timestamp'] || !body['message'] || !body['sender'] || !body['me'] || !body['group'] || !body['appId']) {
        console.log(`Not all required parameters are inside the body: `, body)
        return res.status(400).json({'status': 'not all required parameters are inside the body'})
    }

    const timestamp = body['timestamp']
    const message = body['message']
    const sender = body['sender']
    const group = body['group']
    const me = body['me']
    const appId = body['appId']

    if (!req.headers[Headers.JIMBER_HEADER] || !req.headers[Headers.JIMBER_HEADER]) {
        console.log('No Jimber header present')
        return res.status(400).json({'status': 'no jimber header present'})
    }

    const signedAuthorization: string = req.headers[Headers.JIMBER_HEADER] as string
    console.log('This is the signed authorization: ', signedAuthorization)

    const derivedPublicKey = await getDerivedPublicKeyByUsername(me, appId)
    console.log(`Derived key for user: ${me} : `, derivedPublicKey)
    if (derivedPublicKey == null) {
        console.log(`Could not find public key for user ${me} with appId ${appId}`)
        return res.status(404).json({'status': 'no public key found for given user'})
    }

    const header = { 'intention': 'retrieve-identifier' }
    const verifiedAuthorization = await validateSign(header, signedAuthorization, derivedPublicKey)
    if (verifiedAuthorization == null) {
        console.log('Could not verify the headers')
        return res.status(400).json({'status': 'could not verify headers'})
    }

    const query = db.createQuery('Identifiers').filter('appId', '=', appId).filter('username', '=', me).limit(1)


    const [identifiers] = await db.runQuery(query)

    const receiverIdentifier = identifiers[0].identifier

    const notificationData: NotificationItem = {
        timestamp,
        message,
        sender,
        group,
        me,
        appId,

    }

    sendNotification(notificationData, receiverIdentifier)

    return res.status(200).json({'status': 'successfully posted notification'})
})


const sendNotification = (data: NotificationItem, receiverIdentifier: string) => {
    const message = {
        notification: {
            'title': data.sender,
            'body': data.message,
        },
        data: { data: JSON.stringify(data) },
        token: receiverIdentifier,
    }

    FCM.send(message, function(err: any, resp: any) {
        if (err) {
            console.log(err)
        }
    })
}


// This is the Firebase HTTPS function
exports.api = functions.region('europe-west2').https.onRequest(app)
