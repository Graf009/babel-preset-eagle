'use strict';

var path = require('path');

function preset(context, opts) {
  opts = opts || {};

  var plugins = [
      // export * as ns from 'mod'
      require.resolve('babel-plugin-transform-export-extensions'),
      // class { handleClick = () => { } }
      require.resolve('babel-plugin-transform-class-properties'),
      // { ...todo, completed: true }
      require.resolve('babel-plugin-transform-object-rest-spread'),
      // function* () { yield 42; yield 43; }
      [require.resolve('babel-plugin-transform-regenerator'), {
        // Async functions are converted to generators by babel-preset-latest
        async: false
      }],
      // Polyfills the runtime needed for async/await and generators
      [require.resolve('babel-plugin-transform-runtime'), {
        helpers: false,
        polyfill: false,
        regenerator: true,
        // Resolve the Babel runtime relative to the config.
        moduleName: path.dirname(require.resolve('babel-runtime/package'))
      }]
    ];

  // We are not using `env` because it’s ignored in versions > babel-core@6.10.4:
  // https://github.com/babel/babel/issues/4539
  // It’s also nice that we can enforce `NODE_ENV` being specified.
  var env = process.env.BABEL_ENV || process.env.NODE_ENV;

  if (env === 'development' || env === 'test') {
    plugins.push.apply(plugins, [
      // Adds component stack to warning messages
      require.resolve('babel-plugin-transform-react-jsx-source'),
      // Adds __self attribute to JSX which React will use for some warnings
      require.resolve('babel-plugin-transform-react-jsx-self')
    ]);
  }

  if (env === 'production') {
    // Optimization: hoist JSX that never changes out of render()
    // Disabled because of issues:
    // * https://phabricator.babeljs.io/search/query/pCNlnC2xzwzx/
    // * https://github.com/babel/babel/issues/4516
    // TODO: Enable again when these issues are resolved.
    // plugins.push.apply(plugins, [
    //   require.resolve('babel-plugin-transform-react-constant-elements')
    // ]);
  }

  return {
    comments: false,
    compact: env === 'production',
    presets: [
      // Latest stable ECMAScript features
      [require.resolve('babel-preset-latest'), {
        es2015: opts
      }],
      // JSX, Flow
      require.resolve('babel-preset-react')
    ],
    plugins: plugins
  };
}

/**
 * This preset was originally an object, before function-based configurable presets were introduced.
 * For backward-compatibility with anything that may have been loading this preset and expecting
 * it to be a simple Babel config object, we export the old config here via default object.
 */
var oldConfig = preset({});

// However, for backward compatibility with babel-core < v6.13.x, we use the 'buildPreset'
// property of the preset object for the preset creation function with the enumerability
// caveat mentioned below.
Object.defineProperty(oldConfig, "buildPreset", {
  configurable: true,
  writable: true,
  // We make this non-enumerable so old versions of babel-core won't see it as an unknown property,
  // while allowing new versions to see it as a preset builder function.
  enumerable: false,
  value: preset,
});

module.exports = oldConfig;
