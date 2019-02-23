'use strict';

const path = require('path');
const fs = require('fs');
const url = require('url');

// Make sure any symlinks in the project folder are resolved:
// https://github.com/facebookincubator/create-react-app/issues/637
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

const envPublicUrl = process.env.PUBLIC_URL;
const VER_ENV = process.env.VER_ENV;

// console.log(process.env);

function ensureSlash(path, needsSlash) {
  const hasSlash = path.endsWith('/');
  if (hasSlash && !needsSlash) {
    return path.substr(path, path.length - 1);
  } else if (!hasSlash && needsSlash) {
    return `${path}/`;
  } else {
    return path;
  }
}

const getPublicUrl = appPackageJson =>
  envPublicUrl || require(appPackageJson).homepage;

// We use `PUBLIC_URL` environment variable or "homepage" field to infer
// "public path" at which the app is served.
// Webpack needs to know it to put the right <script> hrefs into HTML even in
// single-page apps that may serve index.html for nested URLs like /todos/42.
// We can't use a relative path in HTML because we don't want to load something
// like /todos/42/static/js/bundle.7289d.js. We have to know the root.
function getServedPath(appPackageJson) {
  const publicUrl = getPublicUrl(appPackageJson);
  const servedUrl =
    envPublicUrl || (publicUrl ? url.parse(publicUrl).pathname : '/');
  return ensureSlash(servedUrl, true);
}

// config after eject: we're in ./config/
module.exports = {
  root: appDirectory,
  dotenv: resolveApp('.env'),
  appBuild: process.env.NODE_ENV=="production" && process.env.VER_ENV!='desktop' ? resolveApp(process.env.VER_ENV=='simulate'? 'build_simulate':'build') : (process.env.NODE_ENV=="test" ? resolveApp('test') : resolveApp('electron/ui')),
  appPublic: resolveApp('public'),
  appHtml: process.env.VER_ENV=='desktop' ? resolveApp('public/electron.html') : resolveApp('public/index.html'),
  appTdexHtml: resolveApp('public/tdex.html'),
  appIndexJs: process.env.VER_ENV=='desktop' ? resolveApp('src/electron.js') : resolveApp('src/index.js'),
  appTdexJs: resolveApp('src/tdex.js'),
  appPackageJson: resolveApp('package.json'),
  appSrc: resolveApp('src'),
  yarnLockFile: resolveApp('yarn.lock'),
  testsSetup: resolveApp('src/setupTests.js'),
  appNodeModules: resolveApp('node_modules'),
  publicUrl: getPublicUrl(resolveApp('package.json')),
  servedPath: VER_ENV=='desktop' ? './' : getServedPath(resolveApp('package.json')),
  noCopyFiles: [resolveApp('public/index.html'), resolveApp('public/electron.html')]
};
