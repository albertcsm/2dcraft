const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');

module.exports = (env, options) => {
  return {
    entry: './src/index.ts',
    devtool: options.mode === 'development' ? 'inline-source-map' : 'nosources-source-map',
    devServer: {
      static: './dist',
    },
    plugins: [
      new HtmlWebpackPlugin({
        title: '2D Craft',
        favicon: 'src/assets/icon/favicon.png'
      }),
      new WebpackPwaManifest({
        name: '2dcraft',
        short_name: '2dcraft',
        description: 'Minecraft like game in 2D',
        background_color: '#ffffff',
        icons: [
          {
            src: path.resolve('src/assets/icon/dirt.png'),
            sizes: [36, 48, 72, 96, 144, 192, 120, 152, 167, 180],
            ios: true
          }
        ],
        ios: true,
        publicPath: '.'  // https://github.com/arthurbergmz/webpack-pwa-manifest/issues/149
      }),
    ],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif|json|xml|mp3)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.html$/i,
          loader: "html-loader",
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
  }
};
