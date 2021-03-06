import Application from '@ember/application';
import { run } from '@ember/runloop';
import EnginesInitializer from '../../initializers/engines';
import Engine from 'ember-engines/engine';
import { module, test } from 'qunit';

import Resolver from '../../resolver';
import config from '../../config/environment';

let App, app, appInstance;

module('Unit | EngineInstance', {
  beforeEach() {
    EnginesInitializer.initialize();

    App = Application.extend({
      Resolver,
      modulePrefix: config.modulePrefix,
      router: null,
    });

    run(function() {
      app = App.create();
    });
  },

  afterEach() {
    if (appInstance) {
      run(appInstance, 'destroy');
    }

    if (app) {
      run(app, 'destroy');
    }
  },
});

test('it can build a child engine instance without parent dependencies defined', function(
  assert
) {
  assert.expect(1);

  let BlogEngine = Engine.extend({
    router: null,
    dependencies: Object.freeze({}),
  });

  app.engines = undefined;

  app.register('engine:blog', BlogEngine);

  let appInstance = app.buildInstance();
  appInstance.setupRegistry();

  let blogEngineInstance = appInstance.buildChildEngineInstance('blog');

  assert.ok(blogEngineInstance);

  return blogEngineInstance.boot();
});

test('it can build a child engine instance with no dependencies', function(
  assert
) {
  assert.expect(1);

  let BlogEngine = Engine.extend({ router: null });

  app.register('engine:blog', BlogEngine);

  let appInstance = app.buildInstance();
  appInstance.setupRegistry();

  let blogEngineInstance = appInstance.buildChildEngineInstance('blog');

  assert.ok(blogEngineInstance);

  return blogEngineInstance.boot();
});

test('it can build a child engine instance with dependencies', function(
  assert
) {
  assert.expect(2);

  let BlogEngine = Engine.extend({
    router: null,
    dependencies: Object.freeze({
      services: ['store'],
    }),
  });

  app.engines = {
    blog: {
      dependencies: {
        services: ['store'],
      },
    },
  };

  app.register('engine:blog', BlogEngine);

  let appInstance = app.buildInstance();
  appInstance.setupRegistry();

  let blogEngineInstance = appInstance.buildChildEngineInstance('blog');

  assert.ok(blogEngineInstance);

  return blogEngineInstance.boot().then(() => {
    assert.strictEqual(
      blogEngineInstance.lookup('service:store'),
      appInstance.lookup('service:store'),
      'services are identical'
    );
  });
});

test('it can build a child engine instance with dependencies that are aliased', function(
  assert
) {
  assert.expect(2);

  let BlogEngine = Engine.extend({
    router: null,
    dependencies: Object.freeze({
      services: [
        'data-store', // NOTE: Blog engine uses alias to 'store'
      ],
    }),
  });

  app.engines = {
    blog: {
      dependencies: {
        services: [
          { 'data-store': 'store' }, // NOTE: Main engine provides alias
        ],
      },
    },
  };

  app.register('engine:blog', BlogEngine);

  let appInstance = app.buildInstance();
  appInstance.setupRegistry();

  let blogEngineInstance = appInstance.buildChildEngineInstance('blog');

  assert.ok(blogEngineInstance);

  return blogEngineInstance.boot().then(() => {
    assert.strictEqual(
      blogEngineInstance.lookup('service:data-store'),
      appInstance.lookup('service:store'),
      'aliased services are identical'
    );
  });
});
