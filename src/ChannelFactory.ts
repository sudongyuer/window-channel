import { ChannelClient } from './ChannelClient'
import { ChannelService } from './ChannelService'
import { ChannelClientImpl } from './impl/ChannelClientImpl'
import { ChannelServiceImpl } from './impl/ChannelServiceImpl'


class ChannelFactory {
    
    newChannelClient(clientWindow: Window, serviceWindow: Window, origin: string): ChannelClient {
        return new ChannelClientImpl(clientWindow, serviceWindow, origin)
    }

    
    newChannelService(serviceWindow: Window): ChannelService {
        return new ChannelServiceImpl(serviceWindow)
    }

}

export const ChannelFactoryInstance = new ChannelFactory()
