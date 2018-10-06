// @flow

// import '@babel/polyfill';

import path from 'path';
import _ from 'lodash';
import Koa from 'koa';
import Pug from 'koa-pug';
// import container from './container';

export default () => {
  const app = new Koa();

  const pug = new Pug({
    viewPath: path.join(__dirname, 'views'),
    noCache: process.env.NODE_ENV === 'development',
    debug: true,
    pretty: true,
    compileDebug: true,
    locals: [],
    basedir: path.join(__dirname, 'views'),
    helperPath: [
      { _ },
      // { urlFor: (...args) => router.url(...args) },
    ],
  });
  pug.use(app);
  return app;
};
