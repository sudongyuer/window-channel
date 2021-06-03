# WindowChannel window与iframe的前端通讯库

#介绍
此库用于一个window嵌套iframe这种场景之下完成消息的传递,此库对window的原生postMessage和addEventListener('message',(e)=>{},false)做了一层封装

# 安装
```
npm install @imf/window-channel
```

## 前端引用
```

```
参数解释
+ server：服务器地址「必填」
+ roomId: 房间id「必填[eng, idr]」
+ token：用户token「选填」
+ theme：主题色「选填[blue] 默认：blue」
+ lang：语言「选填[en, id] 默认：印尼(id)」

## 客服主页面
```
测试 http://crowd.jinuo.fun/page/support?server=ws://sample.com/sample&token=12a1b2a131bc31d490
正式 https://chateasy.io/page/support?server=wss://sample.com/sample&token=12a1b2a131bc31d490
```
参数解释
+ server：服务器地址「必填」
+ token：用户token「必填」
+ theme：主题色「选填[blue] 默认：blue」
+ lang：语言「选填[en, id] 默认：印尼(id)」

### 管理员主页面
```
测试 http://crowd.jinuo.fun/page/admin?server=ws://sample.com/sample&token=12a1b2a131bc31d490
正式 https://chateasy.io/page/admin?server=wss://sample.com/sample&token=12a1b2a131bc31d490
```
参数解释
+ server：服务器地址「必填」
+ token：用户token「必填」

# iframe 跨源通信库
实现三方与Crowd iframe的通信功能

### 1.install
```
npm i @imf/crowd-support
```
### 2. 配置 与 使用
父窗口
```typescript
import { CrowdClientFactory, Config, Message, Event } from "@imf/crowd-support"

// 需页面挂载完成后创建实例
// 由于通信基于iframe，需要保持iframe全局存在且挂载以保持通信
// 父窗口须传递iframe的唯一name绑定
// 默认阻止跨源，需配置源实现跨源通信
const config: Config = {
    el: 'iframe name',
    allowOrigin: ['*.childDomain.com', 'childDomain.com']
}
const Client = CrowdClientFactory.Client
const client = new Client(config)

// 监听消息
// Message{
//    messageType: string,  text: 文本 | emoji消息   photo: 图片消息
//    messageContent: string
// }
client.listenMessage((msg: Message) => {
    console.log('listen:', msg)
})

// 发送消息
const msg: Message = {
    messageType: 'text',
    messageContent: 'hello from child'
}
client.postMessage(msg)

// 监听事件
// Event{
//   eventType: string          loginEvent: 登录事件
//   eventContent?: string      loginEvent下登录链接
// }
client.listenEvent((msg: Event) => {
    switch (msg.eventType) {
        case 'loginEvent':
            clearToken().then(() => {
                // 发送事件
                client.postEvent(
                    {
                        eventType: 'loginEvent',
                        eventContent: 'fatherDomain.com/login'
                    }
                )
            })
            break
        default:
            throw 'unsupport event type'
    }
})
```
子窗口
```typescript
import { CrowdClientFactory, Config, Message, Event } from "@imf/crowd-support"

const config = {
    allowOrigin: ['*.fatherDomain.com', 'fatherDomain.com']
}

const Client = CrowdClientFactory.Client
const client = new Client(config)

const login = () => {
    client.postEvent(
        {
            eventType: 'loginEvent'
        }
    )
}
```