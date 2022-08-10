"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//Modules
const fs_1 = __importDefault(require("fs"));
const readline_sync_1 = __importDefault(require("readline-sync"));
const path_1 = __importDefault(require("path"));
const shelljs_1 = __importDefault(require("shelljs"));
//TODO: Maybe work on command line utils?
//Default config
const config = {
    paths: [],
    identifiers: {
        n64: {
            fancy: "N64",
            cmd: "mupen64plus --fullscreen $0"
        }
    },
    fileTypes: {
        n64: "n64",
        z64: "n64"
    },
    gameLaunches: {}
};
//Random stuff
function saveConfig() {
    fs_1.default.writeFileSync("config.json", JSON.stringify(config, null, 2));
}
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const red = '\x1b[31m%s\x1b[0m';
const green = '\x1b[32m%s\x1b[0m';
const yellow = '\x1b[33m%s\x1b[0m';
const blue = '\x1b[34m%s\x1b[0m';
//Config Management
console.log(blue, 'Loading the config...');
if (fs_1.default.existsSync("config.json")) {
    //Load config
    const cfg = JSON.parse(fs_1.default.readFileSync("config.json", { flag: 'r' }).toString());
    for (const k of Object.keys(cfg)) {
        if (typeof (config[k]) === typeof (cfg[k])) {
            config[k] = cfg[k];
        }
    }
}
else {
    saveConfig();
}
//Check if there are any rom paths
if (config['paths'].length === 0) {
    console.log(yellow, "There does not seem to be any rom folder set, Please specify the absolute path. You can also specify multiple by using a comma!");
    var temp = readline_sync_1.default.question("> ").split(",");
    for (const str of temp) {
        const path = str.replace(/^\s+/g, '');
        console.log(blue, `Checking ${path}`);
        if (fs_1.default.existsSync(path)) {
            console.log(green, `Path exists...`);
            if (fs_1.default.lstatSync(path).isFile()) {
                console.log(red, "That path is a file, skipping it.");
                continue;
            }
            console.log(green, "Adding it to the rom paths.");
            config.paths.push(path);
        }
        else {
            console.log(red, "Path doesn't exists, skipping it.");
        }
        saveConfig();
    }
}
console.log(blue, 'Loading games.');
const games = {};
for (const folder of config['paths']) {
    if (fs_1.default.lstatSync(folder).isFile()) {
        console.log(red, `Found a file (${folder}), skipping and removing it.`);
        config.paths.splice(config.paths.indexOf(folder), 1);
        continue;
    }
    for (const file of fs_1.default.readdirSync(folder)) {
        if (fs_1.default.lstatSync(path_1.default.join(folder, file)).isDirectory())
            continue;
        const match = /[\w\-(), ]+\.([\w\- ]+)/.exec(file);
        if (match != null) {
            console.log("m");
            const name = match.shift();
            const ext = match.pop();
            if (name == null || ext == null) {
                continue;
            }
            const type = config.fileTypes[ext];
            if (!type) {
                console.log(red, `Could not find a type for the extension '${ext}'.`);
                continue;
            }
            if (!games.hasOwnProperty(type)) {
                games[type] = [];
            }
            games[type].push({
                name: name,
                dir: folder
            });
            console.log(blue, `Loaded ${name}`);
        }
    }
}
saveConfig();
console.log(green, "Done!");
//Clear console
process.stdout.write("\u001b[3J\u001b[2J\u001b[1J");
console.clear();
console.log("Select a console:\n");
for (var i = Object.keys(games).length - 1; i >= 0; i--) {
    console.log(`  [${i}] ${config.identifiers[Object.keys(games)[i]].fancy} | ${games[Object.keys(games)[i]].length} Game(s) loaded`);
}
console.log();
const emu = readline_sync_1.default.questionInt("> ");
if (!(emu >= 0 && emu < Object.keys(games).length)) {
    console.log(red, 'Invalid input.');
    process.exit(1);
}
const type = Object.keys(games)[emu];
//Clear console
process.stdout.write("\u001b[3J\u001b[2J\u001b[1J");
console.clear();
console.log("Select a game:\n");
for (var i = games[type].length - 1; i >= 0; i--) {
    const name = games[type][i].name;
    console.log(`  [${i}] ${name.substring(0, name.lastIndexOf("."))}`);
}
console.log();
const game = readline_sync_1.default.questionInt("> ");
if (!(game >= 0 && game < games[type].length)) {
    console.log(red, 'Invalid input.');
    process.exit(1);
}
const cmd = config.identifiers[type].cmd.replace(/\$0/, `'${path_1.default.join(games[type][game].dir, games[type][game].name)}'`);
console.log(green, `Trying to launch ${cmd}...`);
shelljs_1.default.exec(cmd);
