const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
          test: /\.(png|svg|jpg|jpeg|gif|json|xml)$/i,
          type: 'asset/resource',
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
