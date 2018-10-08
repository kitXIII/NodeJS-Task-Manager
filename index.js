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
import bodyParser from 'koa-bodyparser';
import methodOverride from 'koa-methodoverride';
import session from 'koa-generic-session';
import flash from 'koa-flash-simple';

import container from './container';
import addRoutes from './routes';

export default () => {
  const app = new Koa();
  const { logger } = container;
  const date = new Date();
  logger.info(`Application start at ${date.toString()}`);

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

  app.keys = ['im a newer secret', 'i like turtle'];
  app.use(session(app));
  app.use(flash());
  app.use(async (ctx, next) => {
    ctx.state = {
      flash: ctx.flash,
      isSignedIn: () => ctx.session.userId !== undefined,
    };
    await next();
  });
  app.use(bodyParser());
  app.use(methodOverride((req) => {
    // return req?.body?._method;
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      return req.body._method; // eslint-disable-line
    }
    return null;
  }));
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
