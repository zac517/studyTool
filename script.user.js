// ==UserScript==
// @name         学习助手
// @namespace    https://zac.social/
// @version      0.2.0
// @description  学习通测试成绩查看，批改网解除复制粘贴限制。
// @author       zac517
// @match        mooc1.chaoxing.com/*
// @match        https://www.pigai.org/*
// @icon         https://one.hfut.edu.cn/favicon.ico
// @run-at       document-start
// @grant        unsafeWindow
// @downloadURL https://update.greasyfork.org/scripts/532290/%E5%90%88%E5%B7%A5%E5%A4%A7%E5%AD%A6%E4%B9%A0%E5%8A%A9%E6%89%8B.user.js
// @updateURL https://update.greasyfork.org/scripts/532290/%E5%90%88%E5%B7%A5%E5%A4%A7%E5%AD%A6%E4%B9%A0%E5%8A%A9%E6%89%8B.meta.js
// ==/UserScript==

(function () {
    'use strict';

    // 站点功能配置文件
    let site = null;
    const siteConfigs = {
        'chaoxing.com': {
            onPageLoaded: () => {
                const requiredParams = ['courseid', 'clazzid', 'cpi'];

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

                createJumpButton();
            }
        },
        'www.pigai.org/index.php?c=v2&a=write': {
            onScriptLoaded: {
                'script[src="https://cdn.pigai.org//res/javascript/spss.js?d=2022111501"]': {
                    callback: () => {
                        unsafeWindow.init_no_paste = () => {return false};
                    }
                }
            },
            onPageLoaded: () => {
                const node = document.querySelector('#request_y');
                node.unselectable = 'off';
                node.onselectstart = '';
                const childNode = document.querySelector('.no_paste > div');
                childNode.style = '';
            }
        },
        'www.pigai.org/index.php?c=v2&a=view': {
            data: {
                score: 0,
            },
            onScriptLoaded: {
                'script[src="https://cdn.pigai.org//res/javascript/view.js?d=2024112903"]': {
                    callback: () => {
                        unsafeWindow.init_no_paste_by_snt = () => {return false};
                    }
                }
            },
            onElementAdded: {
                'b#rescoreTxt': {
                    callback: (node) => site.data.score = node.innerText,
                }
            },
            onPageLoaded: () => {
                function genPromptFromPage() {
                    // 提取文章评语
                    const commentElement = document.getElementById('allpingyu_txt');
                    const articleComment = commentElement ? commentElement.textContent.trim() : '';

                    const elements = document.querySelectorAll('.view3Item:not(.view3duan)');
                    let totalString = '';

                    elements.forEach(element => {
                        // 提取句子编号并去除首尾空白
                        const view3xh = element.querySelector('.view3xh');
                        const sentenceNumber = view3xh ? view3xh.textContent.trim() : '';

                        // 提取句子内容并去除首尾空白
                        const view3Sent = element.querySelector('.view3Sent');
                        const sentTxt = view3Sent ? view3Sent.querySelector('.sentTxt') : null;
                        const sentenceContent = sentTxt ? sentTxt.textContent.trim() : '';

                        // 提取点评信息
                        const view3Error = element.querySelector('.view3Error');
                        const errorList = view3Error ? view3Error.querySelector('ul') : null;
                        const errorItems = errorList ? errorList.querySelectorAll('li') : [];

                        let relevantComments = [];

                        errorItems.forEach(item => {
                            if (item.classList.contains('error') || item.classList.contains('warn')) {
                                let commentText = '';
                                const childNodes = item.childNodes;
                                childNodes.forEach(node => {
                                    if (node.nodeType === Node.TEXT_NODE) {
                                        commentText += node.textContent;
                                    } else if (node.nodeType === Node.ELEMENT_NODE &&
                                        !node.classList.contains('stips') &&
                                        !node.classList.contains('snt_info')) {
                                        commentText += node.textContent;
                                    }
                                });
                                // 去除点评内容的首尾空白和换行符、制表符
                                relevantComments.push(commentText.trim().replace(/[\u0009\u000A]/g, ''));
                            }
                        });

                        // 如果有相关点评，则拼接信息
                        if (relevantComments.length > 0) {
                            const combinedComments = relevantComments.join('\n');
                            totalString += `${sentenceNumber} ${sentenceContent}\n 点评：\n${combinedComments}\n\n`;
                        }
                    });

                    // 将分数和文章评语拼接到字符串开头
                    let finalString = `当前作文分数为 ${site.data.score}。\n作文评语为：${articleComment}。\n可改进的句子如下：\n${totalString}`
                        + `注意：
1. 网站给出的点评虽然说是让你检查，但实际上你不修改他就会一直扣分，所以无论你觉得对不对，一定要想办法修改。
2. 点评中，所有提到存在拼写有误的地方，如果点评中给出了具体的修改方案就按给出的方案改，没有就自己改。
3. 作文的评分系统是通过识别每个词实现的，所以被他指出有问题的词，就算你觉得没问题，为了得到更高的分也必须修改，否则会一直被指出。
4. 如果你觉得难以改正，就尝试换成其他意思相近的表达（不能还含有原被指出的拼写）。
5. 作文中应只使用英文，绝对不能出现中文，即使是在引用中文词语或俗语。
6. 回答时，英语作文使用英语回答，要给出修改后的完整文章，不省略不修改的部分。
7. 回答时，提供的其他信息（比如向我解释修改了哪些内容）必须使用中文给出。
请跟据以上相关信息和要求进行修改，提高作文的分数。`;

                    return finalString;
                }
                console.log(genPromptFromPage());
            }
        }
    };

    // 匹配站点逻辑 靠后覆盖
    const href = unsafeWindow.location.href;
    for (const domain in siteConfigs) {
        if (href.includes(domain)) site = siteConfigs[domain];
    }

    // 元素被添加后的逻辑
    if ((site?.onElementAdded && Object.keys(site.onElementAdded).length > 0) || (site?.onScriptLoaded && Object.keys(site.onScriptLoaded).length > 0)) {
        const callback = function (mutationsList) {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    for (const addedNode of mutation.addedNodes) {
                        if (site?.onElementAdded) {
                            Object.keys(site.onElementAdded).forEach((element) => {
                                if (addedNode === document.querySelector(element)) {
                                    site.onElementAdded[element].callback(addedNode);
                                }
                            })
                        }
                        if (site?.onScriptLoaded) {
                            Object.keys(site.onScriptLoaded).forEach((element) => {
                                if (addedNode === document.querySelector(element)) {
                                    addedNode.onload = site.onScriptLoaded[element].callback;
                                }
                            })
                        }
                    }
                }
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(document, { attributes: true, childList: true, subtree: true });
    }


    // 网页加载完毕后的逻辑
    if (site?.onPageLoaded) {
        unsafeWindow.addEventListener('load', () => site.onPageLoaded());
    };



    function createMenu() {
        const css = `
        #study-tool-menu {
            display: inline-block !important;
            margin: 0 !important;
            position: fixed !important;
            left: 40px;
            top: calc(50vh - 150px);
            width: 200px;
            height: 300px;
            border-radius: 10px !important;
            background-color: white !important;
            border: 1px solid rgba(0, 0, 0, 0.1) !important;
            box-shadow: 0 0 40px 0 rgba(0, 0, 0, 0.05) !important;
            padding: 10px !important;
            z-index: 9999 !important;
            cursor: grab;
            overflow: hidden !important;
            box-sizing: border-box !important;
        }

        #study-tool-menu.collapsed-left, #study-tool-menu.collapsed-right {
            height: 60px !important;
        }

        #study-tool-menu.collapsed-left {
            left: -190px;
        }

        #study-tool-menu.collapsed-right {
            left: calc(100% - 10px);
        }

        #study-tool-menu.collapsed-left:hover {
            left: -140px;
        }

        #study-tool-menu.collapsed-right:hover {
            left: calc(100% - 60px);
        }
        `;

        // 创建 style 元素并添加到 head
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        const div = document.createElement('div');
        div.id = 'study-tool-menu';
        div.innerHTML = `
        <div>666</div>
        <h1>123</h1>
        `;

        let isDragging = false;
        let offsetX, offsetY, startX, startY;

        div.addEventListener('mousedown', (e) => {
            isDragging = true;
            div.style.cursor = 'grabbing';
            div.style.transition = 'none';
            const divRect = div.getBoundingClientRect();
            offsetX = e.clientX - divRect.left;
            offsetY = e.clientY - divRect.top;
            startX = e.clientX;
            startY = e.clientY;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                div.style.left = (e.clientX - offsetX) + 'px';
                div.style.top = (e.clientY - offsetY) + 'px';
            }
        });

        document.addEventListener('mouseup', (e) => {
            isDragging = false;
            div.style.transition = 'left 0.5s';
            const windowWidth = window.innerWidth;
            const divRect = div.getBoundingClientRect();
            if (divRect.left <= 0 || divRect.right >= windowWidth) {
                if (startX == e.clientX && startY == e.clientY) expandMenu();
                else {
                    if (divRect.left <= 0) {
                        div.style.left = '';
                        div.classList.add('collapsed-left');
                    }
                    else {
                        div.style.left = '';
                        div.classList.add('collapsed-right');
                    }
                }
            }
            else expandMenu();
            div.style.cursor = 'grab';
        });

        function expandMenu() {
            div.classList.remove('collapsed-left', 'collapsed-right');
            const windowWidth = window.innerWidth;
            const divRect = div.getBoundingClientRect();
            if (divRect.left < 0) div.style.left = '40px';
            else if (divRect.right > windowWidth) div.style.left = 'calc(100% - 240px)';
        }

        document.body.appendChild(div);
    }

})();    
