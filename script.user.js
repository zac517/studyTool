// ==UserScript==
// @name         合工大学习助手
// @namespace    https://zac.social/scripts
// @version      0.1.0
// @description  学习通测试成绩查看，批改网解除粘贴限制。
// @author       zac517
// @match        https://mooc1.chaoxing.com/*
// @match        https://www.pigai.org/*
// @icon         https://one.hfut.edu.cn/favicon.ico
// @run-at       document-start
// @grant        unsafeWindow
// @downloadURL https://update.greasyfork.org/scripts/532290/%E5%90%88%E5%B7%A5%E5%A4%A7%E5%AD%A6%E4%B9%A0%E5%8A%A9%E6%89%8B.user.js
// @updateURL https://update.greasyfork.org/scripts/532290/%E5%90%88%E5%B7%A5%E5%A4%A7%E5%AD%A6%E4%B9%A0%E5%8A%A9%E6%89%8B.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // 后续可以在这里添加更多域名和对应功能的映射
    const domainFunctions = {
        'chaoxing.com': function() {
            // 定义目标参数列表
            const requiredParams = ['courseid', 'clazzid', 'cpi'];

            // 生成新链接的函数
            function generateNewUrl() {
                const urlParams = new URLSearchParams(unsafeWindow.location.search);
                const params = requiredParams.reduce((acc, param) => {
                    const value = urlParams.get(param);
                    if (value) acc[param] = value;
                    return acc;
                }, {});

                // 检查必要参数是否齐全
                if (requiredParams.every(param => params[param])) {
                    const newParams = new URLSearchParams();
                    for (const key in params) {
                        if (params.hasOwnProperty(key)) {
                            newParams.append(key, params[key]);
                        }
                    }
                    newParams.append('ut', 's');
                    return `https://stat2-ans.chaoxing.com/exam-stastics/index?${newParams.toString()}`;
                }
                return null;
            }

            // 创建跳转按钮
            function createJumpButton() {
                const newUrl = generateNewUrl();
                if (!newUrl) return;

                const button = document.createElement('a');
                button.href = '#';
                button.target = '_blank';
                button.className = 'jb_btn jb_btn_104 createTopic fl fs14 marginRight30 ';
                button.style.cssText = `
                    z-index: 999;
                    width: 104px;
                    height: 36px;
                    background: url(https://groupweb.chaoxing.com/res/course/images/discuss/jb_btn_104.png) no-repeat 0 0;
                    position: relative;
                    top: -29px;
                    float: right;
                `;
                button.textContent = '查看成绩';

                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    unsafeWindow.open(newUrl, '_blank');
                });

                const topBackElement = document.querySelector('.top-back');

                if (topBackElement) {
                    topBackElement.appendChild(button);
                }
            }

            // 页面加载完成后执行
            unsafeWindow.addEventListener('load', createJumpButton);
        },
        'pigai.org': function() {
            const urlParams = new URLSearchParams(unsafeWindow.location.search);
            if (urlParams.get('c') === 'v2' && urlParams.get('a') === 'write') {
                const originalAddEventListener = Element.prototype.addEventListener;
                Element.prototype.addEventListener = function(type, listener, options) {
                    if ((type === 'contextmenu' || type === 'dragenter' || type === 'paste') && this.matches('textarea[name="contents"]#contents.from_contents')) {
                        return;
                    }
                    return originalAddEventListener.call(this, type, listener, options);
                };

                Object.defineProperty(document, 'onpaste', {
                    get: function() {
                        return null;
                    },
                    set: function() {
                        return;
                    }
                });
            }
        },
    };

    const currentHostname = unsafeWindow.location.hostname;
    for (const domain in domainFunctions) {
        if (currentHostname.includes(domain)) {
            domainFunctions[domain]();
            break;
        }
    }
})();    
