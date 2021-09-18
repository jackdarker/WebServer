"use strict"
const {createServer} = require("http");
const {parse} = require("url");
const {resolve,sep} = require("path");
const {createReadStream} = require("fs");
const {stat,readdir} = require("fs").promises;
const mime = require("mime");

const host = 'localhost';
var opt = parseCmdLine();
const port = opt.port;
const servDir = sep+(opt.dir)+sep;
const baseDir = process.cwd();

const methods = Object.create(null); //collection of handlers for GET,PUT,POST,...
console.log('starting webserver for '+baseDir+servDir+' on port '+port)
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
function parseCmdLine(){
    let opt = {port:8000,dir:'public'};
    console.log('you can specify cmd-line options: p:portnumber d:server-directory');
    for(var i=2;i<process.argv.length;i++) {
        var _op = process.argv[i];
        if(_op.substr(0,2)==='p:') {
            opt.port=parseInt(_op.substr(2));
        } else if(_op.substr(0,2)==='d:') {
            opt.dir=_op.substr(2);
        } else {
            console.log('unknown option '+_op);
        }
    }
    return(opt);
}