const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const VersionPlugin = require('./build/version_plugin');
const AndroidIndexPlugin = require('./build/android_index_plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const webJsOptions = {
  babelrc: false,
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'entry',
        corejs: 3
      }
    ]
  ],
  plugins: [
    '@babel/plugin-syntax-dynamic-import',
    'module:nanohtml',
    ['@babel/plugin-proposal-class-properties', { loose: false }]
  ]
};

const serviceWorker = {
  target: 'webworker',
  entry: {
    serviceWorker: './app/serviceWorker.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(png|jpg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[contenthash:8].[ext]'
        }
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[contenthash:8].[ext]'
            }
          },
          {
            loader: 'svgo-loader',
            options: {
              plugins: [
                { removeViewBox: false }, // true causes stretched images
                { convertStyleToAttrs: true }, // for CSP, no unsafe-eval
                { removeTitle: true } // for smallness
              ]
            }
          }
        ]
      },
      {
        // loads all assets from assets/ for use by common/assets.js
        test: require.resolve('./common/generate_asset_map.js'),
        use: ['babel-loader', 'val-loader']
      }
    ]
  },
  plugins: [new webpack.IgnorePlugin(/\.\.\/dist/)]
};

const web = {
  target: 'web',
  entry: {
    app: ['./app/main.js'],
    android: ['./android/android.js'],
    ios: ['./ios/ios.js']
  },
  output: {
    chunkFilename: '[name].[contenthash:8].js',
    filename: '[name].[contenthash:8].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        oneOf: [
          {
            loader: 'babel-loader',
            include: [
              path.resolve(__dirname, 'app'),
              path.resolve(__dirname, 'common'),
              // some dependencies need to get re-babeled because we
              // have different targets than their default configs
              path.resolve(
                __dirname,
                'node_modules/@dannycoates/webcrypto-liner'
              ),
              path.resolve(__dirname, 'node_modules/@fluent'),
              path.resolve(__dirname, 'node_modules/intl-pluralrules')
            ],
            options: webJsOptions
          },
          {
            // Strip asserts from our deps, mainly choojs family
            include: [path.resolve(__dirname, 'node_modules')],
            exclude: [
              path.resolve(__dirname, 'node_modules/crc'),
              path.resolve(__dirname, 'node_modules/@fluent'),
              path.resolve(__dirname, 'node_modules/@sentry'),
              path.resolve(__dirname, 'node_modules/tslib'),
              path.resolve(__dirname, 'node_modules/webcrypto-core')
            ],
            loader: 'webpack-unassert-loader'
          }
        ]
      },
      {
        test: /\.(png|jpg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[contenthash:8].[ext]'
        }
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[contenthash:8].[ext]'
            }
          },
          {
            loader: 'svgo-loader',
            options: {
              plugins: [
                { cleanupIDs: false },
                { removeViewBox: false }, // true causes stretched images
                { convertStyleToAttrs: true }, // for CSP, no unsafe-eval
                { removeTitle: true } // for smallness
              ]
            }
          }
        ]
      },
      {
        // creates style.css with all styles
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          use: [
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1
              }
            },
            'postcss-loader'
          ]
        })
      },
      {
        test: /\.ftl$/,
        use: 'raw-loader'
      },
      {
        // creates test.js for /test
        test: require.resolve('./test/frontend/index.js'),
        use: ['babel-loader', 'val-loader']
      },
      {
        // loads all assets from assets/ for use by common/assets.js
        test: require.resolve('./common/generate_asset_map.js'),
        use: ['babel-loader', 'val-loader']
      }
    ]
  },
  plugins: [
    new CopyPlugin([
      {
        context: 'public',
        from: '*.*'
      }
    ]),
    new webpack.EnvironmentPlugin(['NODE_ENV']),
    new webpack.IgnorePlugin(/\.\.\/dist/), // used in common/*.js
    new ExtractTextPlugin({
      filename: '[name].[md5:contenthash:8].css'
    }),
    new VersionPlugin(), // used for the /__version__ route
    new AndroidIndexPlugin(),
    new ManifestPlugin() // used by server side to resolve hashed assets
  ],
  devtool: 'source-map',
  devServer: {
    before:
      process.env.NODE_ENV === 'development' && require('./server/bin/dev'),
    compress: true,
    hot: false,
    host: '0.0.0.0',
    proxy: {
      '/api/ws': {
        target: 'ws://localhost:8081',
        ws: true,
        secure: false
      }
    }
  }
};

module.exports = (env, argv) => {
  const mode = argv.mode || 'production';
  // eslint-disable-next-line no-console
  console.error(`mode: ${mode}`);
  process.env.NODE_ENV = web.mode = serviceWorker.mode = mode;
  if (mode === 'development') {
    // istanbul instruments the source for code coverage
    webJsOptions.plugins.push('istanbul');
    web.entry.tests = ['./test/frontend/index.js'];
  }
  return [web, serviceWorker];
};
