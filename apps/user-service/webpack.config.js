module.exports = function (options, webpack) {
    return {
        ...options,
        entry: {
            main: options.entry,
            cli: './src/cli.ts',
        },
        output: {
            filename: '[name].js',
            path: options.output.path,
        },
    };
};