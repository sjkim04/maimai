import axios from "axios";
import parse from "node-html-parser";
import { Agent } from "https";

const LOGIN_PAGE =
  "https://maimaidx.jp/maimai-mobile/";
const LOGIN_API_ENDPOINT =
  "https://maimaidx.jp/maimai-mobile/submit/";
const AIME_SELECT_ENDPOINT = "https://maimaidx.jp/maimai-mobile/aimeList/submit/?idx=1"

const COOKIE_REGEX = /([^=]+)=([^;]+);/g;
const cookies = new Map<string, Map<string, string>>();

const MAINTENANCE_REGEX = /Sorry, servers are under maintenance/;
const ERROR_REGEX = /エラーコード：([0-9a-zA-Z]+)/;

// ignoring cert, dangerous in some situations but it's maimai..

export const segaAxios = axios.create({
  baseURL: "https://maimaidx.jp/maimai-mobile/",
  responseType: "text",
  headers: {
    Referer: "https://maimaidx.jp/maimai-mobile/",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0",
  },
  httpsAgent: new Agent({ rejectUnauthorized: false }),
});

segaAxios.interceptors.request.use((config) => {
  if (!config.url) return config;
  const url = new URL(config.url, segaAxios.defaults.baseURL);
  const cookie = cookies.get(url.hostname);

  if (cookie) {
    const cookieString = Array.from(cookie.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");
    const headers = config.headers;
    headers.set("Cookie", cookieString);
    return {
      ...config,
      headers,
    };
  }
  return config;
});

segaAxios.interceptors.response.use((response) => {
  if (!response.config.url) return response;
  console.log(
    response.config.url.replace(/\?ssid=.*$/, "?ssid=****"),
    response.config.params
  );
  if (MAINTENANCE_REGEX.test(response.data)) {
    throw new Error("Maintenance is ongoing on maimai-net.");
  }
  if (ERROR_REGEX.test(response.data)) {
    const [, error] = ERROR_REGEX.exec(response.data)!;
    const doc = parse(response.data);
    const errorMessage = doc.querySelector(".p_5.f_12.gray.break")?.text.trim();
    throw new Error(`[${error}] ${errorMessage}`);
  }
  const url = new URL(response.config.url, segaAxios.defaults.baseURL);
  const setCookie = response.headers["set-cookie"];
  if (setCookie) {
    setCookie.forEach((cookie) => {
      COOKIE_REGEX.lastIndex = 0;
      const match = COOKIE_REGEX.exec(cookie);
      if (!match) return;
      const [, key, value] = match;
      const cookieMap = cookies.get(url.hostname) || new Map();
      cookieMap.set(key, value);
      cookies.set(url.hostname, cookieMap);
    });
  }
  return response;
});

export const setCookie = (hostname: string, cookie: string) => {
  const cookieMap = new Map<string, string>();
  cookie.split(";").forEach((pair) => {
    const [key, value] = pair.split("=");
    cookieMap.set(key.trim(), value.trim());
  });
  cookies.set(hostname, cookieMap);
};

export const getCookie = (hostname: string) => {
  const cookieMap = cookies.get(hostname);
  if (!cookieMap) return null;
  return Object.entries(cookieMap)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
};

export const clearCookie = (hostname: string) => {
  cookies.delete(hostname);
};

export const login = async (id: string, password: string) => {
  const { data } = await segaAxios.get(LOGIN_PAGE);
  const loginDom = parse(data, {
    parseNoneClosedTags: true,
  });

  const token = loginDom.querySelector("div.main_wrapper > div.see_through_block form[method='post']")!.querySelector("input[name='token']")!.attributes.value;
  console.log(token)


  const formData = new FormData();
  formData.append("segaId", id);
  formData.append("password", password);
  formData.append("token", token);

  const loginRes = await segaAxios.post(LOGIN_API_ENDPOINT, formData, {
    maxRedirects: 0,
    validateStatus: (status) => status === 302,
  });
  
  const { location: loginRedirect } = loginRes.headers;

  await segaAxios.get(loginRedirect, {
    maxRedirects: 0,
    validateStatus: () => true,
  });

  const aimeRes = await segaAxios.get(AIME_SELECT_ENDPOINT, {
    maxRedirects: 0,
    validateStatus: (status) => status === 302,
  });

  const { location: aimeRedirect } = aimeRes.headers;
  await segaAxios.get(aimeRedirect);

};
