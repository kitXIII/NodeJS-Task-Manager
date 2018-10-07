// @flow

// import '@babel/polyfill';

import path from 'path';
import _ from 'lodash';
import Koa from 'koa';
import serve from 'koa-static';
import mount from 'koa-mount';
import Pug from 'koa-pug';
import koaLogger from 'koa-logger';
import Router from 'koa-router';

import container from './container';
import addRoutes from './routes';

export default () => {
  const app = new Koa();
  const { logger } = container;

  logger.info('Application start');

  app.use(async (ctx, next) => {
    try {
      await next();
      const status = ctx.status || 404;
      if (status === 404) {
        ctx.throw(404, `Page not found on ${ctx.method} ${ctx.url}`);
      }
    } catch (err) {
      ctx.status = err.status || 500;
      if (ctx.status === 404) {
        await ctx.render('404');
        logger.warning(err.message);
      } else {
        await ctx.render('500');
        logger.error(err, ctx.request);
      }
    }
  });

  app.use(mount('/assets', serve(path.join(__dirname, 'dist'))));
  app.use(koaLogger());

  const router = new Router();
  addRoutes(router, container);
  app.use(router.allowedMethods());
  app.use(router.routes());

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
      { urlFor: (...args) => router.url(...args) },
    ],
  });
  pug.use(app);

  return app;
};
