 module.exports = {
  entry: './src/index.js',
  output: {
    path: __dirname + '/public',
    filename: 'bundle.js'
  },
  module: {
    rules: [
       {
        test: /\.json$/,
        loader: 'json-loader'
      },
      { 
        test: /\.css$/, 
        loader: [ 'style-loader', 'css-loader' ] 
      },
      { 
        test: /\.scss$/, 
        loader: [ 'style-loader', 'css-loader', 'sass-loader' ] 
      },
      {
        exclude: /node_modules/,
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['react', 'es2015', 'stage-2']
            }
          }
        ]
      }
    ]
  }
};