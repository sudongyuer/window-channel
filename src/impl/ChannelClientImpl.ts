import { ChannelClient } from '../ChannelClient'
import { ChannelUpstream, ChannelDownstream } from '../ChannelMessage'
import * as uuid from 'uuid'

type Callback = {
    success: (response: any) => void
    failed: (error: any) => void
}

type Subscriber = (response: any) => void

export class ChannelClientImpl implements ChannelClient {
    isRunning = true
    clientWindow: Window
    serviceWindow: Window
    origin: string

    requestCache = new Map<String, Callback>()
    subscriptionCache = new Map<String, Set<Subscriber>>()

    constructor(clientWindow: Window, serviceWindow: Window, origin: string) {
        this.clientWindow = clientWindow
        this.serviceWindow = serviceWindow
        this.origin = origin
        clientWindow.addEventListener('message', this.receiveResponse.bind(this), false)
    }

    receiveResponse(ev: MessageEvent) {
        if (ev.origin !== this.origin) {
            return
        }
        const response = (<ChannelDownstream>(ev.data))

        if ((response.type === 'response' || response.type === 'ack') && this.requestCache.has(response.requestId)) {
            const callback = this.requestCache.get(response.requestId)!!
            if (response.status === 200) {
                callback.success(response.body)
            } else {
                callback.failed(response.body)
            }
            this.requestCache.delete(response.requestId)
        } else if (response.type === 'event' && this.subscriptionCache.has(response.destination)) {
            const subscribers = this.subscriptionCache.get(response.destination)!!
            subscribers.forEach((subscriber) => {
                subscriber(response.body)
            })
        }
    }

    timeoutFailed(requestId: string) {
        if (this.requestCache.has(requestId)) {
            const callback = this.requestCache.get(requestId)!!
            this.requestCache.delete(requestId)
            callback.failed('Request Timeout')
        }
    }

    actualSubscribe(destination: string, callback: Callback, timeout: number = 3) {
        const request = <ChannelUpstream>{
            type: 'subscribe',
            requestId: uuid.v4(),
            destination: destination
        }
        this.serviceWindow.postMessage(request, this.origin)
        this.requestCache.set(request.requestId, callback)
        setTimeout(() => {
            this.timeoutFailed(request.requestId)
        }, timeout)
    }

    request<REQUEST, RESPONSE>(destination: string, message: REQUEST, timeout: number = 3): Promise<RESPONSE> {
        if (!this.isRunning) {
            throw Error('This client has finished.')
        }
        const request = <ChannelUpstream>{
            type: 'request',
            requestId: uuid.v4(),
            destination: destination,
            body: message
        }
        return new Promise((resolve, reject) => {
            this.serviceWindow.postMessage(request, this.origin)
            this.requestCache.set(request.requestId, <Callback>{success: resolve, failed: reject})
            setTimeout(() => {
                this.timeoutFailed(request.requestId)
            }, timeout)
        })
    }

    subscribe<RESPONSE>(destination: string, subscriber: (response: RESPONSE) => void, timeout: number = 3): Promise<void> {
        if (!this.isRunning) {
            throw Error('This client has finished.')
        }
        return new Promise((resolve, reject) => {
            if (!this.subscriptionCache.has(destination)) {
                this.subscriptionCache.set(destination, new Set<Subscriber>())
                this.actualSubscribe(destination, <Callback>{
                    success: () => {
                        this.subscriptionCache.get(destination)!!.add(subscriber)
                        resolve()
                    },
                    failed: () => {
                        this.subscriptionCache.delete(destination)
                        reject()
                    }
                }, timeout)
            } else {
                this.subscriptionCache.get(destination)!!.add(subscriber)
                resolve()
            }
        })
    }

    unsubscribe(destination: string, timeout: number = 3) {
        const request = <ChannelUpstream>{
            type: 'unsubscribe',
            requestId: uuid.v4(),
            destination: destination
        }
        this.serviceWindow.postMessage(request, this.origin)
        this.subscriptionCache.delete(destination)
    }

    finish(): void {
        this.isRunning = false
        this.clientWindow.removeEventListener('message', this.receiveResponse, false)
    }
}