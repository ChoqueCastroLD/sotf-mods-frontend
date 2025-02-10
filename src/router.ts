import { Elysia } from "elysia";

import { render } from "./middlewares/render.middleware";
import { authMiddleware } from "./middlewares/auth.middleware";

const loggedOnly = async ({ user, set }: any) => {
  if (!user) {
    set.redirect = "/login";
  }
};

let cache: { [key: string]: any } = {};

async function callAPI(url: string, options?: any) {
  // const cacheKey = `${url}-${JSON.stringify(options)}`;
  // if (cache[cacheKey] && options?.no_cache !== true) {
  //   // return cache[cacheKey];
  // }
  const res = await fetch(`${Bun.env.PUBLIC_API_URL}${url}`, options);
  const data = await res.json();
  // cache[cacheKey] = data;
  return data;
}

export const router = new Elysia()
  .use(authMiddleware)
  // auth
  .get("/login", render("login"))
  .get("/register", render("register"))
  .get("/logout", ({ cookie: { token }, set }) => {
    token.remove();
    set.redirect = "/login";
  })
  // user
  .get("/profile/:userSlug", async (context) => {
    const {
      params: { userSlug },
    } = context;
    const { status, data: userProfile } = await callAPI(
      `/api/users/${userSlug}`
    );
    if (!status) {
      return (context.set.redirect = "/404");
    }
    return render("profile", { userProfile })(context);
  })
  .get(
    "/upload",
    async (context) => {
      const { status, data: categories } = await callAPI(
        `/api/categories?type=Mod`
      );
      if (!status) {
        return (context.set.redirect = "/404");
      }
      return render("upload", { categories })(context);
    },

    { beforeHandle: loggedOnly }
  )
  .get(
    "/upload-build",
    async (context) => {
      const { status, data: categories } = await callAPI(
        `/api/categories?type=Build`
      );
      if (!status) {
        return (context.set.redirect = "/404");
      }
      return render("upload-build", { categories })(context);
    },
    { beforeHandle: loggedOnly }
  )
  // public
  .get("/", async ({ set }) => {
    set.redirect = "/mods";
  })

  .get("/mods", async (context) => {
    let modsQuery = new URLSearchParams();
    modsQuery.set("nsfw", context.query.nsfw === "true" ? "true" : "false");
    modsQuery.set(
      "approved",
      context.query.showunapproved === "true" ? "false" : "true"
    );
    modsQuery.set("orderby", context.query.orderby || "newest");
    if (context.query.category)
      modsQuery.set("category", context.query.category);
    if (context.query.search) modsQuery.set("search", context.query.search);
    if (context.query.page) modsQuery.set("page", context.query.page);
    modsQuery.set("limit", "16");
    modsQuery.set("type", "Mod");
    const [
      { data: mods, meta },
      { data: featured },
      { data: stats },
      { data: categories },
    ] = await Promise.all([
      callAPI(`/api/mods?${modsQuery.toString()}`),
      callAPI(`/api/mods/featured`),
      callAPI(`/api/stats`),
      callAPI(`/api/categories?type=Mod`),
    ]);
    console.log(mods);
    
    return render("mods", { mods, meta, stats, categories, featured })(context);
  })
  .get("/builds", async (context) => {
    let modsQuery = new URLSearchParams();
    modsQuery.set("nsfw", context.query.nsfw === "true" ? "true" : "false");
    modsQuery.set(
      "approved",
      context.query.showunapproved === "true" ? "false" : "true"
    );
    modsQuery.set("orderby", context.query.orderby || "newest");
    if (context.query.category)
      modsQuery.set("category", context.query.category);
    if (context.query.search) modsQuery.set("search", context.query.search);
    if (context.query.page) modsQuery.set("page", context.query.page);
    modsQuery.set("limit", "16");
    modsQuery.set("type", "Build");
    const [
      { data: mods, meta },
      { data: featured },
      { data: stats },
      { data: categories },
    ] = await Promise.all([
      callAPI(`/api/mods?${modsQuery.toString()}`),
      callAPI(`/api/builds/featured`),
      callAPI(`/api/stats/builds`),
      callAPI(`/api/categories?type=Build`),
    ]);
    console.log(featured);
    
    console.log(`/api/mods?${modsQuery.toString()}`);
    
    return render("builds", { mods, meta, stats, categories, featured })(
      context
    );
  })
  .get("/mods/:userSlug/:mod_slug", async (context) => {
    const {
      params: { userSlug, mod_slug },
    } = context;
    console.log({ userSlug, mod_slug });
    const { status, data: mod } = await callAPI(
      `/api/mods/slug/${userSlug}/${mod_slug}`,
      {
        headers: {
          Authorization: "Bearer " + context.cookie.token.value,
        },
      }
    );
    if (!status) {
      return (context.set.redirect = "/404");
    }
    console.log(mod);

    return render("mod", { mod })(context);
  })
  .get("/builds/:userSlug/:build_slug", async (context) => {
    const {
      params: { userSlug, build_slug },
    } = context;

    console.log({ userSlug, build_slug });
    const { status, data: build } = await callAPI(
      `/api/mods/slug/${userSlug}/${build_slug}`,
      {
        headers: {
          Authorization: "Bearer " + context.cookie.token.value,
        },
      }
    );
    if (!status) {
      return (context.set.redirect = "/404");
    }
    console.log(build);
    return render("build", { mod: build })(context);
  })
  .get(
    "/mods/:userSlug/:mod_slug/download/:version",
    async ({ params: { userSlug, mod_slug, version }, request, set }) => {
      const ip = "" + request.headers.get("x-forwarded-for");
      const agent = "" + request.headers.get("user-agent");
      const f = await fetch(
        `${Bun.env.PUBLIC_API_URL}/api/mods/slug/${userSlug}/${mod_slug}/download/${version}?ip=${ip}&agent=${agent}`
      );
      const blob = await f.blob();
      set.headers["Content-Type"] = "" + f.headers.get("Content-Type");
      set.headers["Content-Length"] = "" + f.headers.get("Content-Length");
      set.headers["Content-Disposition"] =
        "" + f.headers.get("Content-Disposition");
      return blob;
    }
  )
  .get("/loader", render("loader"))
  .get("/privacy", render("privacy"))
  .get(
    "/ads.txt",
    () => "google.com, pub-2799839819522052, DIRECT, f08c47fec0942fa0"
  );
