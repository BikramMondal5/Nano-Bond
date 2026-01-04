// .pnpmfile.cjs
function readPackage(pkg) {
    // Remove test files from thread-stream package
    if (pkg.name === 'thread-stream') {
        pkg.files = pkg.files || [];
        pkg.files = pkg.files.filter(f =>
            !f.includes('test') &&
            !f.includes('bench') &&
            f !== 'README.md' &&
            f !== 'LICENSE'
        );
        // Only include necessary files
        if (pkg.files.length === 0) {
            pkg.files = ['index.js', 'lib'];
        }
    }
    return pkg;
}

module.exports = {
    hooks: {
        readPackage
    }
}
