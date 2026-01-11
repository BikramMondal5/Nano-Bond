// Process stub to prevent browser errors with libraries that expect Node.js environment
if (typeof window !== 'undefined' && !window.process) {
    window.process = {
        cwd: () => '/',
        env: {},
        browser: true,
        version: '',
        versions: {},
    };
}
