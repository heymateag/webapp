const path = require('path');

const dotenv = require('dotenv');

const {
  EnvironmentPlugin,
  ProvidePlugin,
} = require('webpack');
const CopyPlugin = require("copy-webpack-plugin");
const HtmlPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const TerserJSPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

dotenv.config();

module.exports = (env = {}, argv = {}) => {
  return {
    mode: argv.mode,
    entry: './src/index.tsx',
    target: 'web',
    devServer: {
      contentBase: [
        path.resolve(__dirname, 'public'),
        path.resolve(__dirname, 'public/lib'),
        path.resolve(__dirname, 'node_modules/emoji-data-ios'),
        path.resolve(__dirname, 'node_modules/opus-recorder/dist'),
        path.resolve(__dirname, 'src/lib/webp'),
        path.resolve(__dirname, 'src/lib/rlottie'),
        path.resolve(__dirname, 'src/lib/secret-sauce'),
      ],
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
      port: 4200,
      host: 'localhost',
      disableHostCheck: true,
      stats: 'minimal',
    },
    output: {
      filename: '[name].[contenthash].js',
      chunkFilename: '[id].[chunkhash].js',
      assetModuleFilename: '[name].[contenthash].[ext]',
      path: path.resolve(__dirname, argv['output-path'] || 'dist'),
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx|js)$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
              },
            },
            'postcss-loader',
          ],
        },
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.(woff(2)?|ttf|eot|svg|png|jpg|tgs)(\?v=\d+\.\d+\.\d+)?$/,
          type: 'asset/resource',
        },
        {
          test: /-extra\.json$/,
          loader: 'file-loader',
          type: 'javascript/auto',
          options: {
            name: '[name].[contenthash].[ext]',
          },
        },
        {
          test: /\.wasm$/,
          loader: 'file-loader',
          type: 'javascript/auto',
          options: {
            name: '[name].[contenthash].[ext]',
          },
        },
        {
          test: /\.(txt|tl)$/i,
          loader: 'raw-loader',
        },
      ],
    },
    resolve: {
      alias: {
        teact: path.resolve(__dirname, 'src/lib/teact/'),
        'teact-dom': 'teact/teact-dom',
        // react: 'teact/teact',
        // 'react-dom': 'teact/teact-dom',
      },
      extensions: ['.js', '.ts', '.tsx'],
      fallback: {
        path: require.resolve('path-browserify'),
        os: require.resolve('os-browserify/browser'),
        buffer: require.resolve('buffer/'),
        stream: require.resolve("stream-browserify"),
        https: require.resolve("https-browserify"),
        crypto: require.resolve("crypto-browserify"),
        http: require.resolve("stream-http"),
        assert: require.resolve("assert"),
        net: false,
        fs: false,
        electron: false,
      },
    },
    plugins: [
      new HtmlPlugin({
        template: 'src/index.html',
      }),
      new MiniCssExtractPlugin({
        filename: '[name].[contenthash].css',
        chunkFilename: '[name].[chunkhash].css',
        ignoreOrder: true,
      }),
      new EnvironmentPlugin({
        APP_NAME: 'Heymate App',
        APP_VERSION: '',
        APP_ENV: '',
        TELEGRAM_T_API_ID: '',
        TELEGRAM_T_API_HASH: '',
        CELO_NET_URL: '',
        ZOOM_SDK_KEY: '',
        ZOOM_SDK_SECRET: '',
        TEST_SESSION: '',
        NODE_DEBUG: '',
      }),
      new ProvidePlugin({
        Buffer: [require.resolve("buffer/"), "Buffer"],
      }),
      new CopyPlugin({
        patterns: [{
          from: path.resolve(
            __dirname,
            'node_modules',
            '@zoom',
            'videosdk',
            'dist',
            'lib',
          ),
          to: path.resolve(__dirname, 'public', 'lib'),
        }, ]
      }),
      ...(argv.mode === 'production' ? [
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        }),
      ] : []),
    ],

    ...(!env.noSourceMap && {
      devtool: 'source-map',
    }),

    ...(argv['optimize-minimize'] && {
      optimization: {
        minimize: !env.noMinify,
        minimizer: [
          new TerserJSPlugin({ sourceMap: true }),
          new CssMinimizerPlugin(),
        ],
      },
    }),
  };
};
