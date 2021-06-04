# WindowChannel window与iframe的前端通讯库

# 介绍
此库用于一个window嵌套iframe这种场景之下完成消息的传递,此库对window的原生postMessage和addEventListener('message',(e)=>{},false)做了一层封装

# 安装
```
npm install @imf/window-channel
```

## 前端引用
```
import {WindowChannel} from '@imf/window-channel'
```
## 配置 与 使用

## 客户端页面
## 语法
### WindowChannel.newChannelClient(currentWindow,targetWindow,targetOrigin)
#### currentWindow  为当前客户端的window对象
#### targetWindow  为Iframe的window对象
#### targetOrigin  为通过窗口的targetOrigin属性来指定哪些窗口能接收到消息事件,其值可以是字符串"\*"（表示无限制）或者一个URI。在发送消息的时候，如果目标窗口的协议、主机地址或端口这三者的任意一项不匹配targetOrigin提供的值，那么消息就不会被发送；只有三者完全匹配，消息才会被发送。这个机制用来控制消息可以发送到哪些窗口；例如，当用postMessage传送密码时，这个参数就显得尤为重要，必须保证它的值与这条包含密码的信息的预期接受者的origin属性完全一致，来防止密码被恶意的第三方截获。如果你明确的知道消息应该发送到哪个窗口，那么请始终提供一个有确切值的targetOrigin，而不是*。不提供确切的目标将导致数据泄露到任何对数据感兴趣的恶意站点。

## 客户端示例
```typescript
//引入库文件
import {WindowChannel} from '@imf/window-channel'

    //创建客户端client
    //1.window为当前客户端的window对象
    //2.iFrame.contentWindow为iFrame的window对象
    //3.loaclhost:3000为目标源
    let client = WindowChannel.newChannelClient(window,iFrame.contentWindow,"*")
    
    //客户端向服务器端请求
    client.request('/hello','客户端发送的消息',1000)
        .then((value)=>{
            console.log(value)
        })
        .catch((err)=>{
        console.log(err)
    })


```
## 服务端页面
## 语法
### WindowChannel.newChannelService(currentWindow)
#### currentWindow  为当前服务端的window对象

### 服务端示例
```typescript
//引入库文件
import {WindowChannel} from '@imf/window-channel'

    //创建服务端service
    //1.window为当前服务端的window对象
let service=WindowChannel.newChannelService(window)
    
    //服务器端向客户端返回请求消息
service.listen('/hello',(value)=>{
    console.log(value)//value为客户端发送的消息
    return '服务端发送的消息' //return 服务端返回的消息
})


```
