import { createRequestHandler } from "@cloudflare/next-on-pages";

addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 使用 next-on-pages 处理请求
  event.respondWith(
    createRequestHandler({
      request,
      page: url.pathname,
      query: url.searchParams,
    })
  );
});
