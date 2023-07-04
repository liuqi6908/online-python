import { createRouter, createWebHistory } from "vue-router";

const routes = [
  { path: "/:catchAll(.*)", redirect: "/" },
  {
    path: "/",
    redirect: "/home",
    name: "Index",
    component: () => import("../views/Index.vue"),
    children: [
      {
        path: "/home",
        name: "Home",
        component: () => import("../views/home/Index.vue"),
      },
      {
        path: "/run",
        name: "Run",
        component: () => import("../views/run/Index.vue"),
      },
      {
        path: "/interaction",
        name: "Interaction",
        component: () => import("../views/interaction/Index.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 导出路由
export default router;
