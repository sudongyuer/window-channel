export interface ChannelService {

    listen<REQUEST, RESPONSE>(destination: string, serve: (request: REQUEST) => RESPONSE): void

    observe<REQUEST>(destination: string, serve?: () => void): void

    broadcast(destination: string, message: any): void

    finish(): void

}