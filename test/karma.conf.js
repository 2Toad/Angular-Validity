'use strict';

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      '../node_modules/angular/angular.js',
      '../node_modules/angular-ui-router/release/angular-ui-router.js',
      '../node_modules/angular-mocks/angular-mocks.js',
      '../angular-validity.js',
      './angular-validity.spec.js'
    ],
    preprocessors: {'../angular-validity.js': ['coverage']},
    reporters: ['progress', 'coverage'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS'],
    singleRun: false,
    concurrency: Infinity
  });
};
