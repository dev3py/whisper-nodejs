const path = require('path');
 
module.exports = {
    entry: {
        main: './app.js',
    },
    output: {
        path: path.join(__dirname, 'prod-build'),
        publicPath: '/',
        filename: '[name].js',
        clean: true,
    },
    mode: 'production',
    target: 'node',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
            },
        ],
    }
}
 