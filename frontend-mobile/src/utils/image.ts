/**
 * Remote image helper.
 *
 * Pizza images are served from `upload.wikimedia.org`, which enforces a
 * User-Agent policy: requests with a bot/empty/generic UA are rejected with
 * HTTP 403. React Native's Android image pipeline (Fresco → OkHttp) sends
 * `okhttp/x.y` by default, so pizza images 403 on real Android devices while
 * loading fine in browsers (which send a normal UA). iOS uses NSURLSession and
 * is unaffected; the header is harmless there.
 *
 * Empirically confirmed (2026-05-29): okhttp/empty UA → 403, descriptive UA → 200.
 *
 * Attaching a descriptive, policy-compliant User-Agent makes the request succeed
 * on Android. Use `remoteImageSource(uri)` for any image loaded from an external
 * host (Wikimedia in particular).
 */
export const REMOTE_IMAGE_USER_AGENT =
  "OmniPizza/1.0 (+https://github.com/gsanchezm/OmniPizza)";

export const remoteImageSource = (uri?: string | null) => ({
  uri: uri || "",
  headers: { "User-Agent": REMOTE_IMAGE_USER_AGENT },
});
