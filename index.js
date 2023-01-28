const XIVAPI = require("@xivapi/js");
const xiv = new XIVAPI();
const fsSync = require("fs");
const fs = require("fs").promises;
const path = require("path");
const cliProgress = require('cli-progress');
const stripJsonComments = require('strip-json-comments');
const util = require("util");

const config = path.join(__dirname, "config.json");
const bar = new cliProgress.SingleBar({ hideCursor: true, format: "[{bar}] {percentage}% | Duration: {duration_formatted} | ETA: {eta_formatted} | {value}/{total}", formatTime: cliProgress.formatTime }, cliProgress.Presets.shades_classic);
let out = undefined;
let apikey = undefined;

const sleep = ms => new Promise(r => setTimeout(r, ms));

const lang = [ "default", "_de", "_en", "_fr", "_ja" ];

const find = async (res) => {
  let results = {
    lang: {
      default: {
        singular:[],
        plural:[]
      },
      de: {
        singular:[],
        plural:[]
      },
      en: {
        singular:[],
        plural:[]
      },
      fr: {
        singular:[],
        plural:[]
      },
      ja: {
        singular:[],
        plural:[]
      }
    }
  };
  bar.start(res.Pagination.ResultsTotal, 0, {
    speed: "N/A"
  });
  for (var i = 0; i <= res.Pagination.ResultsTotal; i++) {
    try {
      var result = await xiv.data.get("MJIItemPouch", i.toString())
      results.lang.default.plural.push(result.Item.Plural);
      results.lang.default.singular.push(result.Item.Singular);
      results.lang.de.plural.push(result.Item.Plural_de);
      results.lang.de.singular.push(result.Item.Singular_de);
      results.lang.en.plural.push(result.Item.Plural_en);
      results.lang.en.singular.push(result.Item.Singular_en);
      results.lang.fr.plural.push(result.Item.Plural_fr);
      results.lang.fr.singular.push(result.Item.Singular_fr);
      results.lang.ja.plural.push(result.Item.Plural_ja);
      results.lang.ja.singular.push(result.Item.Singular_ja);
      bar.update(i);
    } catch (error) {
      console.error({ message: error.message, stack: error.stack });
    }
    await sleep(2000);
  }
  bar.stop();
  return results;
};

const getString = async () => {
  let res;
  try {
    res = await xiv.data.list("MJIItemPouch");
  } catch (error) {
    console.error({ message: error.message, stack: error.stack });
  }
  if (res.Pagination.ResultsTotal > 0) {
    res = await find(res);
  }
  return res;
};

const displayJson = json => {
  if (json.Url) {
    json.Url = `https://xivapi.com${json.Url}`;
  }
  console.log(util.inspect(json, {showHidden: false, depth: null, colors: true}));
};

const run = async () => {
  if (!fsSync.existsSync(config)) {
    console.error({ message: `Config, ${config} does not exist.` });
    return;
  }
  let gottenConfig;
  try {
    gottenConfig = await fs.readFile(config, { encoding: "utf-8" });
  } catch (error) {
    console.error({ message: error.message, stack: error.stack });
  }
  gottenConfig = JSON.parse(stripJsonComments(gottenConfig));
  out = path.join(__dirname, gottenConfig.output);
  apikey = gottenConfig.credentials.apikey;
  let gotten = [];
  try {
    gotten = await getString(apikey);
  } catch (error) {
    console.error({ message: error.message, stack: error.stack });
  }
  try {
    var json = { "data": gotten }
    json = JSON.stringify(json, null, 2);
  } catch (error) {
    console.error({ message: error.message, stack: error.stack });
  }
  try {
    await fs.writeFile(out, json, { encoding: "utf-8", flag: "w", mode: 0o666 });
  } catch (error) {
    console.error({ message: error.message, stack: error.stack });
  }
  displayJson(JSON.parse(json));
};

run();