import webpack from 'webpack';
import autoprefixer from 'autoprefixer';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import cssnano from 'cssnano';

const mode = process.env.NODE_ENV || 'development';
const devMode = process.env.NODE_ENV !== 'production';

export default {
  entry: {
    main: './src/index.js',
  },
  output: {
    publicPath: '/assets/',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: '/node_modules/',
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.min\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
        // use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'fonts/',
          },
        },
      },
      {
        test: /\.(sa|sc)ss$/,
        use: [
          // 'style-loader',
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
          }, {
            loader: 'postcss-loader',
            options: {
              plugins: [
                autoprefixer,
                cssnano,
              ],
            },
          },
          'sass-loader',
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      Popper: ['popper.js', 'default'],
    }),
  ],
  devtool: devMode && 'eval-sourcemap',
  mode,
};
