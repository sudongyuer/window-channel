import { ChannelClient } from '../ChannelClient'
import { ChannelUpstream, ChannelDownstream } from '../ChannelMessage'
import * as uuid from 'uuid'

type Callback = {
    success: (response: any) => void
    failed: (error: any) => void
}

type Subscriber = (response: any) => void

/**
 * 客户端实现类
 */
export class ChannelClientImpl implements ChannelClient {
    isRunning = true
    clientWindow: Window//客户端的window对象
    serviceWindow: Window//服务端的window对象
    origin: string//服务端用于接受消息的源

    requestCache = new Map<String, Callback>()
    subscriptionCache = new Map<String, Set<Subscriber>>()

    constructor(clientWindow: Window, serviceWindow: Window, origin: string) {
        this.clientWindow = clientWindow
        this.serviceWindow = serviceWindow
        this.origin = origin
        //给客户端添加收到消息的事件监听
        clientWindow.addEventListener('message', this.receiveResponse.bind(this), false)
    }

    /**
     * 收到服务端消息的处理函数
     * @param ev 服务端发送的消息事件对象
     */
    receiveResponse(ev: MessageEvent) {
        if (this.origin!=='*'&& ev.origin !== this.origin) {
            return
        }
        const response = (ev.data) as ChannelDownstream

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

    /**
     * 超时失败执行的函数
     * @param requestId 请求Id号
     */
    timeoutFailed(requestId: string) {
        if (this.requestCache.has(requestId)) {
            const callback = this.requestCache.get(requestId)!!
            this.requestCache.delete(requestId)
            callback.failed('Request Timeout')
        }
    }

    /**
     * 确定订阅
     * @param destination 要订阅的借口
     * @param callback    收到消息后触发的回调函数
     * @param timeout     订阅的超时时间
     */
    actualSubscribe(destination: string, callback: Callback, timeout: number = 3000) {
        const request = <ChannelUpstream>{
            type: 'subscribe',
            requestId: uuid.v4(),
            destination: destination
        }
        this.serviceWindow.postMessage(request, this.origin)
        this.requestCache.set(request.requestId, callback)
        setTimeout(()=>{
            this.timeoutFailed(request.requestId)
        }, timeout)
    }

    /**
     * 发送请求
     * @param destination 请求的接口
     * @param message 要发送的消息
     * @param timeout 请求超时时间
     */
    request<REQUEST, RESPONSE>(destination: string, message: REQUEST, timeout: number = 3000): Promise<RESPONSE> {
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
            console.log(this.origin)
            this.serviceWindow.postMessage(request, this.origin)
            this.requestCache.set(request.requestId, <Callback>{success: resolve, failed: reject})
            setTimeout(() => {
                this.timeoutFailed(request.requestId)
            }, timeout)
        })
    }

    /**
     * 请求订阅
     * @param destination 要订阅的接口
     * @param subscriber 订阅成功后的回调函数
     * @param timeout     订阅超时时间
     */
    subscribe<RESPONSE>(destination: string, subscriber: (response: RESPONSE) => void, timeout: number = 3000): Promise<void> {
        if (!this.isRunning) {
            throw Error('This client has finished.')
        }
        return new Promise((resolve, reject) => {
            //没有订阅缓存
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

    /**
     * 取消订阅
     * @param destination 取消订阅的接口
     * @param timeout 取消订阅的超时时间
     */
    unsubscribe(destination: string, timeout: number = 3000) {
        const request = <ChannelUpstream>{
            type: 'unsubscribe',
            requestId: uuid.v4(),
            destination: destination
        }
        this.serviceWindow.postMessage(request, this.origin)
        this.subscriptionCache.delete(destination)
    }

    /**
     * 关闭客户端
     * 释放监听资源
     */
    finish(): void {
        this.isRunning = false
        this.clientWindow.removeEventListener('message', this.receiveResponse, false)
    }
}
