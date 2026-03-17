const nodeExternals = require('webpack-node-externals');

module.exports = function (options, webpack) {
    return {
        ...options,
        externals: [
            nodeExternals({
                allowlist: [/^@app\//],
            }),
        ],
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000,
        }
    };
};