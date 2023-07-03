import { createApp } from 'vue'
import App from './App.vue'
/** 重置样式表 */
import './styles/reset.css'
/** 引入tailwindcss */
import './styles/tailwind.css'
/** 引入路由 */
import router from './router'
/** 引入element-plus */
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

createApp(App).use(router).use(ElementPlus).mount('#app')
