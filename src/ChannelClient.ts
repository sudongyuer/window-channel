export interface ChannelClient {

    request<REQUEST, RESPONSE>(destination: string, message: REQUEST, timeout: number): Promise<RESPONSE>

    subscribe<RESPONSE>(destination: string, subscriber: (response: RESPONSE) => void, timeout: number): Promise<void>

    unsubscribe(destination: string, timeout: number): void

    finish(): void

}