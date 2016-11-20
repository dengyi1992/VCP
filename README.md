# VCP
验证码的后台以及前端的实现
----
<img src="./screenshoot/s01.png">

图片生成的方法有俩种
> require('captchapng');

>require('zengming');

*具体使用请自行搜索*

本文的大致原理是把图片的信息存在hashmap中，key md5（str+time） 值是str
获取图片连接的时候将key写入cookie中，验证的时候将key值和输入的值返服务器来作判断。
