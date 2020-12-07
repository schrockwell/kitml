const fs = require("fs");
const parser = require("./lib/parser");
const util = require("util");

fs.readFile("examples/example.kitml", "utf8", (error, data) => {
  const tokens = parser.parse(data);
  const nested = parser.nest(tokens);

  console.log(
    util.inspect(nested, {
      showHidden: false,
      depth: null,
      colors: true,
    })
  );
});
