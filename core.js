// 注意：这个文件不需要油猴的元数据块

/**
 * 核心执行函数，负责根据匹配到的网站配置来执行相应的逻辑。
 * @param {object | null} site - 通过匹配逻辑找到的当前网站的配置对象。
 */
function core(site) {
    if (!site) {
        console.log('学习助手：当前页面没有待执行的脚本');
        return; // 如果没有匹配的配置，则直接返回
    }

    console.log('学习助手：开始执行当前页面的脚本');

    // 检查是否需要监听元素或脚本加载
    const onElementAddedConfig = site.onElementAdded ? site.onElementAdded() : {};
    const onScriptLoadedConfig = site.onScriptLoaded ? site.onScriptLoaded() : {};

    if (Object.keys(onElementAddedConfig).length > 0 || Object.keys(onScriptLoadedConfig).length > 0) {
        console.log('学习助手：正在劫持元素');
        const callback = function (mutationsList) {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    for (const addedNode of mutation.addedNodes) {
                        // 处理 onElementAdded
                        if (site.onElementAdded) {
                            Object.keys(onElementAddedConfig).forEach((element) => {
                                if (onElementAddedConfig[element].times !== 0 && addedNode.matches && addedNode.matches(element)) {
                                    onElementAddedConfig[element].callback(addedNode);
                                    onElementAddedConfig[element].times -= 1;
                                }
                            });
                        }
                        // 处理 onScriptLoaded
                        if (site.onScriptLoaded) {
                             Object.keys(onScriptLoadedConfig).forEach((element) => {
                                if (onScriptLoadedConfig[element].times !== 0 && addedNode.matches && addedNode.matches(element)) {
                                    addedNode.onload = onScriptLoadedConfig[element].callback;
                                    onScriptLoadedConfig[element].times -= 1;
                                }
                            });
                        }
                    }
                }
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(document, { attributes: true, childList: true, subtree: true });
    }

    // 处理页面加载完成后的逻辑
    if (site.onPageLoaded) {
        console.log('学习助手：正在执行页面加载后的逻辑');
        // 使用 unsafeWindow.addEventListener 以确保在正确的上下文中执行
        unsafeWindow.addEventListener('load', () => site.onPageLoaded());
    }

    console.log('学习助手：脚本已执行完成');
}


/**
 * 创建并管理可拖动的侧边栏菜单。
 */
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
        #study-tool-menu.collapsed-left, #study-tool-menu.collapsed-right { height: 60px !important; }
        #study-tool-menu.collapsed-left { left: -190px; }
        #study-tool-menu.collapsed-right { left: calc(100% - 10px); }
        #study-tool-menu.collapsed-left:hover { left: -140px; }
        #study-tool-menu.collapsed-right:hover { left: calc(100% - 60px); }
    `;

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
            if (startX === e.clientX && startY === e.clientY) {
                expandMenu();
            } else {
                if (divRect.left <= 0) {
                    div.style.left = '';
                    div.classList.add('collapsed-left');
                } else {
                    div.style.left = '';
                    div.classList.add('collapsed-right');
                }
            }
        } else {
            expandMenu();
        }
        div.style.cursor = 'grab';
    });

    function expandMenu() {
        div.classList.remove('collapsed-left', 'collapsed-right');
        const windowWidth = window.innerWidth;
        const divRect = div.getBoundingClientRect();
        if (divRect.left < 0) div.style.left = '40px';
        else if (divRect.right > windowWidth) div.style.left = 'calc(100% - 240px)';
    }

    // 在页面加载完毕后添加菜单，避免影响页面渲染
    window.addEventListener('load', () => {
        document.body.appendChild(div);
    });
}
