const nodeExternals = require('webpack-node-externals');
const swcDefaultConfig = require('@nestjs/cli/lib/compiler/defaults/swc-defaults').swcDefaultsFactory().swcOptions;

module.exports = function (options, webpack) {
    return {
        ...options,
        externals: [
            nodeExternals({
                allowlist: [/^@app\//],
            }),
        ],
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'swc-loader',
                        options: swcDefaultConfig,
                    },
                },
            ],
        },
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000,
        }
    };
};