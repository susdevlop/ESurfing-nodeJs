# ESurfing-nodeJs
基于 node.js 爬虫实现的天翼校园网登陆
 
在做的时候曾多次想到放弃，因为一想到是网页版的就没心思。    
本来应该通过抓包实现的，网页登陆实在没意思     
然后带着不再维护的心态先写了下来

使用方法 ：
克隆本项目并安装包    
插入网线后，ping enet.10000.gd.cn获得ESurfing URL，其他配置请自行获取    
经过测试MAC 、linux 等可能无法使用，因为可能header没配置user-agent，不过可以一试

```
  yarn install
  node index.js
```

参考： [Aixzk/ESurfingPy](https://github.com/Aixzk/ESurfingPy)
