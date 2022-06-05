const path = require('path');
const dotenv = require('dotenv');

const {
  DefinePlugin,
  EnvironmentPlugin,
  ProvidePlugin,
  ContextReplacementPlugin,
  NormalModuleReplacementPlugin,
} = require('webpack');
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { GitRevisionPlugin } = require('git-revision-webpack-plugin');
const StatoscopeWebpackPlugin = require('@statoscope/webpack-plugin').default;
const WebpackContextExtension = require('./dev/webpackContextExtension');
const appVersion = require('./package.json').version;

dotenv.config();

module.exports = (env = {}, argv = {}) => {
  return {
    mode: argv.mode,
    entry: './src/index.tsx',
    target: 'web',
    devServer: {
      port: 1234,
      host: '0.0.0.0',
      allowedHosts: "all",
      hot: false,
      static: [
        {
          directory: path.resolve(__dirname, 'public'),
        },
        {
          directory: path.resolve(__dirname, 'node_modules/emoji-data-ios'),
        },
        {
          directory: path.resolve(__dirname, 'node_modules/opus-recorder/dist'),
        },
        {
          directory: path.resolve(__dirname, 'src/lib/webp'),
        },
        {
          directory: path.resolve(__dirname, 'src/lib/rlottie'),
        },
        {
          directory: path.resolve(__dirname, 'src/lib/secret-sauce'),
        },
      ],
      devMiddleware: {
        stats: 'minimal',
      },
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
            {
              loader: 'css-loader',
              options: {
                modules: {
                  exportLocalsConvention: 'camelCase',
                  auto: true,
                  localIdentName: argv['optimize-minimize'] ? '[hash:base64]' : '[path][name]__[local]'
                }
              }
            },
            'postcss-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.(woff(2)?|ttf|eot|svg|png|jpg|tgs)(\?v=\d+\.\d+\.\d+)?$/,
          type: 'asset/resource',
        },
        {
          test: /\.wasm$/,
          type: 'asset/resource',
        },
        {
          test: /\.(txt|tl)$/i,
          type: 'asset/source',
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
      // Clearing of the unused files for code highlight for smaller chunk count
      new ContextReplacementPlugin(
        /highlight\.js\/lib\/languages/,
        /^((?!\.js\.js).)*$/
      ),
      ...(process.env.APP_MOCKED_CLIENT === '1' ? [new NormalModuleReplacementPlugin(
        /src\/lib\/gramjs\/client\/TelegramClient\.js/,
        './MockClient.ts'
      )] : []),
      new HtmlWebpackPlugin({
        appName: process.env.APP_ENV === 'production' ? 'Telegram Web' : 'Telegram Web Beta',
        appleIcon: process.env.APP_ENV === 'production' ? 'apple-touch-icon' : './apple-touch-icon-dev',
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
        ZOOM_SDK_KEY: '',
        ZOOM_SDK_SECRET: '',
        TEST_SESSION: '',
        NODE_DEBUG: '',
        HEYMATE_API_URL: '',
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
      new StatoscopeWebpackPlugin({
        statsOptions: {
          context: __dirname,
        },
        saveReportTo: path.resolve('./public/statoscope-report.html'),
        saveStatsTo: path.resolve('./public/build-stats.json'),
        normalizeStats: true,
        open: 'file',
        extensions: [new WebpackContextExtension()],
      }),
    ],

    ...(!env.noSourceMap && {
      devtool: 'source-map',
    }),

    ...(process.env.APP_ENV !== 'production' && {
      optimization: {
        chunkIds: 'named',
      }
    }),
  };
};

function getGitMetadata() {
  const gitRevisionPlugin = new GitRevisionPlugin();
  const branch = process.env.HEAD || gitRevisionPlugin.branch();
  const commit = gitRevisionPlugin.commithash().substring(0, 7);
  return { branch, commit };
}
