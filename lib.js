/**
 * Created by TzuHsing on 2021-09-06
 */
var { rsalogin } = require('./RSA')
var fs = require('fs');
var superagent = require('superagent')
var { ESurfingURL, Wlanacip, Wlanuserip, Account, Password } = require('./config.js')
var { createWorker } = require('tesseract.js');
var cheerio = require('cheerio')
const REPEAT = '13002000';
const SUCCESS = '0'

const printFunc = (msg, obj) => {
        console.log(`${new Date().toLocaleTimeString()} ${msg}`, obj ? obj : '')
    }
    //使用 Tesseract 识别二维码
    //提供一个二维码图片地址和callback，并把结果返回给callback
const codeOCR = async(imgUrl) => {
    let worker = createWorker({
        logger: m => {}
    });
    if (!imgUrl) {
        throw Error('cannot read Verification code')
    } else {
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        const { data: { text } } = await worker.recognize(imgUrl);
        await worker.terminate(); // cleans up
        work = null
        return text.replace(/[^\da-z]/gi, "")
    }
}

const login = (cb) => {
    // let filTime = 0 //登录失败次数
    printFunc('正在获取 JSESSIONID ...');
    let url = `http://${ESurfingURL}/qs/index_gz.jsp?wlanacip=${Wlanacip}&wlanuserip=${Wlanuserip}`;
    superagent(url).end(async(err, res) => {
        if (err) {
            return next(err)
        }
        let JSESSIONID = '';
        try {
            JSESSIONID = res.res.headers['set-cookie'][0].split(';')[0].split('=')[1];
        } catch (e) {
            printFunc('获取JSESSIONID:', e)
            cb && cb()
        }
        if (JSESSIONID) {
            let $ = cheerio.load(res.text);
            let imgInfo = $('.am-u-sm-3 > img');
            superagent.get(`http://${ESurfingURL}${imgInfo[0].attribs['src']}`).set({
                'Cookie': `JSESSIONID=${JSESSIONID}`,
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            }).end(async(err, res) => {
                if (err) {
                    printFunc('请求验证码失败', err)
                    cb && cb()
                } else {
                    // fs.writeFileSync('./code.jpg', res.body, "binary");
                    let codeResult = await codeOCR(res.body)
                    if (codeResult && codeResult.length === 4) {
                        printFunc('开启计算rsa,code:', codeResult, )
                        const Loginkey = rsalogin(Account, Password, codeResult);
                        printFunc('计算rsa结束,开始登陆');
                        const LoginUrl = `http://${ESurfingURL}/ajax/login`;
                        // const data = `loginKey=${Loginkey}&wlanuserip=${Wlanuserip}&wlanacip=${Wlanacip}`;
                        const headers = {
                            'Cookie': `loginUser=${Account}; JSESSIONID=${JSESSIONID}`,
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                        }
                        superagent.post(LoginUrl).send({
                                loginKey: Loginkey,
                                wlanuserip: Wlanuserip,
                                wlanacip: Wlanacip
                            }).set(headers)
                            .end((err, res) => {
                                if (err) {
                                    printFunc('err:', err)
                                    cb && cb()
                                } else {
                                    let sres = JSON.parse(res.text);
                                    let code = sres.resultCode;
                                    let signature = '';
                                    printFunc(`登陆结果: ${code === SUCCESS || code === REPEAT ? '成功' : '失败'}${sres.resultInfo}`)
                                    if (code === REPEAT || code === SUCCESS) {
                                        try {
                                            signature = res.res.headers['set-cookie'][0].split(';')[0].split('=')[1];
                                        } catch (e) {
                                            console.log('保存出错，但是登陆成功。由于开发者技术问题，无法登出');
                                        }
                                    } else {
                                        printFunc('请重试')
                                    }
                                    cb && cb(signature)
                                }
                            })
                    } else {
                        printFunc('code不存在或识别二维码错误' + codeResult)
                        cb && cb()
                    }
                }
            })
        }
    })
}

const logout = async(signature) => {
    let url = `http://${ESurfingURL}/ajax/logout`;
    let headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36 SE 2.X MetaSr 1.0',
        'Cookie': `signature=${signature}; loginUser=${Account}`,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }
    superagent.post(url)
        .set(headers)
        .send({
            wlanuserip: Wlanuserip,
            wlanacip: Wlanacip
        })
        .end((err, res) => {
            if (err) {
                printFunc('err:', err)
            } else {
                let sres = JSON.parse(res.text);
                let code = sres.resultCode;
                printFunc(`登出结果:${code === SUCCESS ? '成功' : '失败'} ${sres.resultInfo}`)
            }
        })
}
module.exports = {
    login,
    logout
}