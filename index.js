/**
 * Created by TzuHsing on 2021-09-06
 */

var inquirer = require('inquirer');
var { login, logout } = require('./lib')
const CHOICES = ['登陆', '退出', '啥都不做'];
let question = [{
    type: 'list',
    name: 'select',
    message: '请选择你需要使用的模式',
    choices: CHOICES,
    pageSize: 3
}]
const run = (signature) => {
    inquirer.prompt(question).then((answer) => {
        if (answer.select === CHOICES[0]) {
            login(run);
        } else if (answer.select === CHOICES[1]) {
            if (signature) {
                logout(signature)
            } else {
                console.log('无法执行: 由于开发者技术问题，本次登陆后无法提供登出，网络连接正常即可');
            }
        } else {
            return
        }
    })
}
run()