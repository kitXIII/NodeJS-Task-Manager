// @flow

import '@babel/polyfill';

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
import favicon from 'koa-favicon';
import Rollbar from 'rollbar';

import container from './container';
import addRoutes from './routes';

export default () => {
  const app = new Koa();
  const { logger } = container;
  const rollbar = new Rollbar({
    accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
    captureUncaught: true,
    captureUnhandledRejections: true,
  });

  const date = new Date();
  rollbar.info(`Application start at ${date.toString()}`);

  app.use(async (ctx, next) => {
    try {
      logger('Koa start');
      await next();
      const status = ctx.status || 404;
      logger(`Koa finish, status: ${status}`);
      if (status === 404) {
        ctx.throw(404);
      }
    } catch (err) {
      const { status, message } = err;
      ctx.status = status || 500;
      if (ctx.status !== 500) {
        await ctx.render('error', { status, message });
        logger(err.message);
      } else {
        await ctx.render('500');
        logger(err);
        rollbar.error(err, ctx.request);
      }
    }
  });

  app.keys = [process.env.SESSION_SECRET];
  app.use(session(app));
  app.use(flash());
  app.use(async (ctx, next) => {
    ctx.state = {
      flash: ctx.flash,
      isSignedIn: () => ctx.session.userId !== undefined,
      userName: ctx.session.userName,
      userId: ctx.session.userId,
    };
    logger(`Flash: ${ctx.state.flash.get()}`);
    logger(`Is session set: ${ctx.state.isSignedIn()}`);
    logger(`Username: ${ctx.state.userName}`);
    await next();
  });
  app.use(bodyParser());
  app.use(methodOverride((req) => {
    // return req?.body?._method;
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      logger(`methodoverride: set method "${req.body._method}"`);
      return req.body._method; // eslint-disable-line
    }
    logger('methodoverride: method not found');
    return null;
  }));
  app.use(favicon());
  app.use(mount('/assets', serve(path.join(__dirname, 'dist'))));
  app.use(koaLogger());

  const router = new Router();
  addRoutes(router, container);
  app.use(router.allowedMethods());
  app.use(router.routes());

  const pug = new Pug({
    viewPath: path.join(__dirname, 'views'),
    noCache: container.env === 'development',
    debug: true,
    pretty: true,
    compileDebug: true,
    locals: {
      Title: 'Tasks \uf0ae',
    },
    basedir: path.join(__dirname, 'views'),
    helperPath: [
      { _ },
      { urlFor: (...args) => router.url(...args) },
    ],
  });
  pug.use(app);

  return app;
};
