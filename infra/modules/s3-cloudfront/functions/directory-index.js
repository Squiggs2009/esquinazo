// CloudFront Function (viewer-request): directory-index resolution.
//
// The distribution's origin is the S3 REST endpoint, which - unlike an S3
// website endpoint - never maps /foo/ to /foo/index.html. Without this
// rewrite, static pages written at news/<slug>/index.html are only reachable
// at their literal /index.html URL, and every clean URL falls through to the
// SPA fallback instead.
//
// Paths that already name a file are left alone, so hashed assets under
// /assets/ and files like /favicon.svg are untouched. Anything that does not
// resolve after the rewrite still hits the SPA fallback exactly as before,
// which is what keeps client-side routes (/fixtures, /match/123, and now
// /news/archive) working.
//
// Runtime is cloudfront-js-2.0: ES5-era syntax only, no async, no fetch.
// Deliberately sticking to charAt/indexOf rather than endsWith/includes - this
// runs on every single request to the site, so a syntax feature the runtime
// rejects would take the whole distribution down, not just the Wire.
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.charAt(uri.length - 1) === "/") {
    request.uri = uri + "index.html";
    return request;
  }

  // Only the last segment decides whether this looks like a file - a dot in a
  // parent directory (or in a slug) must not disqualify the rewrite.
  var lastSlash = uri.lastIndexOf("/");
  var lastSegment = lastSlash === -1 ? uri : uri.slice(lastSlash + 1);

  if (lastSegment.indexOf(".") === -1) {
    request.uri = uri + "/index.html";
  }

  return request;
}
