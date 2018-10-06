// @flow

// import '@babel/polyfill';

import path from 'path';
import _ from 'lodash';
import Koa from 'koa';
import serve from 'koa-static';
import mount from 'koa-mount';
import Pug from 'koa-pug';
import container from './container';

export default () => {
  const app = new Koa();
  const log = container.logger;

  app.use(mount('/assets', serve(path.join(__dirname, 'dist'))));

  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      // will only respond with JSON
      ctx.status = err.statusCode || err.status || 500;
      ctx.body = {
        message: err.message,
      };
      if (ctx.status === 404) {
        ctx.render('404');
      }
      ctx.render('500');
    }
  });

  // x-response-time
  app.use(async (ctx, next) => {
    const start = new Date();
    await next();
    const ms = new Date() - start;
    log(`1: ${ctx.method} ${ctx.url} - ${ms}`);
  });

  // logger
  app.use(async (ctx, next) => {
    const start = new Date();
    await next();
    const ms = new Date() - start;
    log(`2: ${ctx.method} ${ctx.url} - ${ms}`);
  });

  // response
  app.use((ctx) => {
    ctx.body = 'Hello World';
    throw new Error('Oi blya-a-a');
  });

  const pug = new Pug({
    viewPath: path.join(__dirname, 'views'),
    noCache: process.env.NODE_ENV === 'development',
    debug: true,
    pretty: true,
    compileDebug: true,
    locals: [], // global_locals_for_all_pages
    basedir: path.join(__dirname, 'views'),
    helperPath: [
      { _ },
      // { urlFor: (...args) => router.url(...args) },
    ],
  });
  pug.use(app);

  return app;
};
