const {createServer} = require("http");
const {parse} = require("url");
const {resolve,sep} = require("path");
const {createReadStream} = require("fs");
const {stat,readdir} = require("fs").promises;
const mime = require("mime");

const host = 'localhost';
const port = process.argv[2] || 8000;
const servDir = sep+'public'+sep;
const baseDir = process.cwd();

const methods = Object.create(null); //collection of handlers for GET,PUT,POST,...
console.log('starting webserver for '+baseDir+servDir+' on port '+port)
console.log('you can specify a different port with first cmd-line argument')
//creates server with promises
createServer((request,response)=> {
    let handler = methods[request.method] || notAllowed;
    handler(request)
    .catch(error=> {
        if(error.status!=null) return error;
        return {body: String(error), status: 500};
    })
    .then(({body, status=200, type = "text/plain"})=> {
        response.writeHead(status, {"Content-Type":type});
    if(body && body.pipe) body.pipe(response);
    else response.end(body);
    });
    }).listen(port);

async function notAllowed(request) {
    return {
        status: 405, 
        body: ('Method '.concat(request.method).concat(' not allowed.'))
    };
}

methods.GET = async function(request){
    let path = urlPath(request.url,true);
    let stats;
    try {
        stats = await stat(path);     
    }
    catch(error) {
        if(error.code!="ENOENT") throw error;
        else return {status:404,body:"File not found in ".concat(path)}; //baseDir+request.url
    }
    if(stats.isDirectory()) {
        return {body: (await readdir(path)).join("\n")};
    } else {
        return {body: createReadStream(path),
                type: mime.lookup(path)};
    }
}

function urlPath(url){
    let {pathname}=parse(url);
    let path = resolve(decodeURIComponent(servDir+pathname).slice(1));
    if(path!=baseDir && !path.startsWith(baseDir+sep)){
            throw {status: 403, body: path+" Forbidden"};
    }
    return path;
}