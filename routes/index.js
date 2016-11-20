var express = require('express');
var router = express.Router();
var captchapng = require('captchapng');
//captchapng版本 0.0.1
var crypto = require('crypto');
function getImg() {
    var p = new captchapng(80, 30, parseInt(Math.random() * 9000 + 1000)); // width,height,numeric captcha
    p.color(0, 0, 0, 0);  // First color: background (red, green, blue, alpha)
    p.color(80, 80, 80, 255); // Second color: paint (red, green, blue, alpha)

    var img = p.getBase64();
    var imgbase64 = new Buffer(img, 'base64');
    return imgbase64;
}

var start = new Date().getTime();
var i = 0;
while ((new Date().getTime() - start) < 1000) {
    var img = getImg();
    i++;
}


var fs = require('fs');
var z = require('zengming');
var BMP24 = z.BMP24;
var font = z.Font;

/*
 用PCtoLCD2002取字模
 行列式扫描，正向取模（高位在前）
 */
var cnfonts = {//自定义字模
    w: 16,
    h: 16,
    fonts: "中国",
    data: [
        [0x01, 0x01, 0x01, 0x01, 0x3F, 0x21, 0x21, 0x21, 0x21, 0x21, 0x3F, 0x21, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0xF8, 0x08, 0x08, 0x08, 0x08, 0x08, 0xF8, 0x08, 0x00, 0x00, 0x00, 0x00], /*"中",0*/
        [0x00, 0x7F, 0x40, 0x40, 0x5F, 0x41, 0x41, 0x4F, 0x41, 0x41, 0x41, 0x5F, 0x40, 0x40, 0x7F, 0x40, 0x00, 0xFC, 0x04, 0x04, 0xF4, 0x04, 0x04, 0xE4, 0x04, 0x44, 0x24, 0xF4, 0x04, 0x04, 0xFC, 0x04], /*"国",1*/
    ]
};

function makeImg2() {
    var img = new BMP24(300, 140);
    img.drawString('helloworld', 20, 10, font.font8x16, 0xff0000);
    img.drawString('helloworld', 20, 25, font.font12x24, 0x00ff00);
    img.drawString('helloworld', 20, 50, font.font16x32, 0x0000ff);
    img.drawString('中国', 20, 85, cnfonts, 0xffffff);
    return img;
}

function makeCapcha() {
    var img = new BMP24(100, 40);
    // img.drawCircle(11, 11, 10, z.rand(0, 0xffffff));
    // img.drawRect(0, 0, img.w-1, img.h-1, z.rand(0, 0xffffff));
    // img.fillRect(53, 15, 88, 35, z.rand(0, 0xffffff));
    // img.drawLine(50, 6, 3, 60, z.rand(0, 0xffffff));
    //return img;

    //画曲线
    // var w=img.w/2;
    // var h=img.h;
    // var color = z.rand(0, 0xffffff);
    // var y1=z.rand(-5,5); //Y轴位置调整
    // var w2=z.rand(10,15); //数值越小频率越高
    // var h3=z.rand(4,6); //数值越小幅度越大
    // var bl = z.rand(1,5);
    // for(var i=-w; i<w; i+=0.1) {
    //     var y = Math.floor(h/h3*Math.sin(i/w2)+h/2+y1);
    //     var x = Math.floor(i+w);
    //     for(var j=0; j<bl; j++){
    //         img.drawPoint(x, y+j, color);
    //     }
    // }

    var p = "ABCDEFGHIJKLMNOPQRSTUVWXYZ3456789";
    var str = '';
    for (var i = 0; i < 5; i++) {
        str += p.charAt(Math.random() * p.length | 0);
    }

    var fonts = [font.font8x16, font.font12x24, font.font16x32];
    var x = 15, y = 8;
    for (var i = 0; i < str.length; i++) {
        var f = fonts[Math.random() * fonts.length | 0];
        y = 8 + z.rand(-10, 10);
        img.drawChar(str[i], x, y, f, z.rand(0, 0xffffff));
        x += f.w + z.rand(2, 8);
    }
    var imageinfo = {};
    imageinfo.img = img;
    imageinfo.str = str;
    return imageinfo;
}

// console.log("1秒钟生成：" + i);
/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});
router.get('/img', function (req, res, next) {
    res.writeHead(200, {
        'Content-Type': 'image/png'
    });
    var img = getImg();
    res.end(img);
});
/**
 * 暂时用hashmap作为存储
 * 后续可以用redis作为中间容器
 */
var HashMap = require("hashmap").HashMap;
map = new HashMap();
router.get('/img2', function (req, res, next) {
    var img = makeCapcha();
    var md5 = crypto.createHash('md5'),
        imgCode = md5.update(img.str + new Date().getTime()).digest('hex');
    map.set(imgCode, img.str);
    res.setHeader("Set-Cookie", 'imgCode=' + imgCode);
    res.writeHead(200, {
        'Content-Type': 'image/bmp'
    });

    res.end(img.img.getFileData());
});
router.get('/verify', function (req, res, next) {
    if (map.get(req.cookies.imgCode)) {
        if (req.query.code == map.get(req.cookies.imgCode).toLowerCase()) {
            res.json({success: true, msg: "验证码正确"})
        } else {
            res.json({success: false, msg: "验证码错误"})
        }
    } else {
        res.json({success: false, msg: "验证码失效"})
    }

});

module.exports = router;
