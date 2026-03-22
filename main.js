const { program } = require('commander');
const fs = require('fs');
const { readFile, writeFile } = require('fs/promises');
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
    const reqUrl = new URL(req.url, `http://${options.host}:${options.port}`);
    const filterSurvived = reqUrl.searchParams.get('survived') === 'true';
    const showAge = reqUrl.searchParams.get('age') === 'true';

    readFile(options.input, 'utf-8')
        .then(data => {

            const rawData = data.split('\n')
                .filter(line => line.trim() !== '')
                .map(line => JSON.parse(line));

            const filteredPassengers = rawData
                .filter(passenger => {
                    if (filterSurvived) {
                        return String(passenger.Survived) === "1" || passenger.Survived === true;
                    }

                    return true;
                })
                .map(passenger => {
                    const xmlObj = { name: passenger.Name, ticket: passenger.Ticket };

                    if (showAge && passenger.Age !== undefined && passenger.Age !== "") {
                        xmlObj.age = passenger.Age;
                    }

                    return xmlObj;
                });

            const builder = new XMLBuilder({ format: true, ignoreAttributes: true });
            const xmlStr = builder.build({ passengers: { passenger: filteredPassengers } });

            res.setHeader('Content-Type', 'application/xml');
            res.writeHead(200);
            res.end(xmlStr);

            return writeFile('latest_response.xml', xmlStr);
        })
        .then(() => {
            console.log("log is saved successfully");
        })
        .catch(err => {
            console.error("promises chain error:", err);

            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end("Internal server error");
            }
        });
});

server.listen(options.port, options.host, () => {
    console.log(`Server is running at http://${options.host}:${options.port}/`);
});