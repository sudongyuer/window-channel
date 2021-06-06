import { ChannelClient } from './ChannelClient'
import { ChannelService } from './ChannelService'
import { ChannelClientImpl } from './impl/ChannelClientImpl'
import { ChannelServiceImpl } from './impl/ChannelServiceImpl'

/**
 * ChannelFactory工厂类
 */
class ChannelFactory {
    /**
     * 创建Channel客户端
     * @param clientWindow 客户端的window对象
     * @param serviceWindow 服务端的window对象
     * @param origin 服务端用于接受消息的源
     */
    newChannelClient(clientWindow: Window, serviceWindow: Window, origin: string): ChannelClient {
        return new ChannelClientImpl(clientWindow, serviceWindow, origin)
    }

    /**
     * 创建channel服务端
     * @param serviceWindow 服务端的window对象
     */
    newChannelService(serviceWindow: Window): ChannelService {
        return new ChannelServiceImpl(serviceWindow)
    }

}

export const ChannelFactoryInstance = new ChannelFactory()