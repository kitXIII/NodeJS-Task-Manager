// import '@babel/polyfill';

import gulp from 'gulp';
import repl from 'repl';
import getServer from '.';
import container from './container';

// gulp.task('default', console.log('Gulp works!'));

gulp.task('console', () => {
  const replServer = repl.start({
    prompt: 'Application console > ',
  });

  Object.keys(container).forEach((key) => {
    replServer.context[key] = container[key];
  });
});

gulp.task('server', (cb) => {
  const port = process.env.PORT || 3000;
  getServer().listen(port, cb);
  container.logger(`Server listen on ${port}`);
});
