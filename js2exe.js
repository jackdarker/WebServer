/* js2exe.js from https://dev.to/jochemstoel/bundle-your-node-app-to-a-single-executable-for-windows-linux-and-osx-2c89
* call "node js2exe.js myscript.js" to build exe
* requires pkg install: "npm install pkg"
*/
const { exec } = require('pkg')
exec([ process.argv[2], '--target', 'host', '--output', 'webserv.exe' ]).then(function() {
    console.log('Done!')
}).catch(function(error) {
    console.error(error)
})