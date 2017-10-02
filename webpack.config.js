const path = require('path');
//const nodeExternals = require('webpack-node-externals');

module.exports = {
	context: __dirname + "/src",

	module: {
		rules: [{
			test: /\.js$/,
			exclude: [/node_modules/],
			use: [{
				loader: 'babel-loader',
				options: { presets: ['env'] },
			}],
		},],
	},

	entry: {
		app: "./app.js",
	},

	output: {
		filename: "[name].bundle.js",
		path: path.resolve(__dirname, "dist", "assets"),
		publicPath: "/assets",
	},

	devServer: {
		contentBase: path.resolve(__dirname, 'src'),
	},

    //target: 'node',
    //externals: [nodeExternals()],
};
