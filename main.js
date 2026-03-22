const { program } = require('commander');
const fs = require('fs');
const http = require('http');
const { XMLBuilder } = require('fast-xml-parser');

program
    .requiredOption('-i, --input <path>')
    .requiredOption('-h, --host <address>')
    .requiredOption('-p, --port <number>')
    .configureOutput({
        outputError: (str, write) => {
            if (str.includes("required option")) {
                return write("Error: specify required options (-i, -h, -p)\n");
            }

            return write(str);
        }
    });

program.parse();
const options = program.opts();

if (!fs.existsSync(options.input)) {
    console.error("Cannot find input file");
    process.exit(1);
}

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("Server is created. Part 2 soon");
});

server.listen(options.port, options.host, () => {
    console.log(`Server is running at http://${options.host}:${options.port}/`);
});