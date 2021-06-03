export interface ChannelMessage {
    requestId: string
    destination: string
    body: any
}

export interface ChannelUpstream extends ChannelMessage {
    type: "request" | "subscribe" | "unsubscribe"
}

export interface ChannelDownstream extends ChannelMessage {
    type: "response" | "event" | "ack"
    status: 200 | 400
    description: string
}
