import puppeteer from "puppeteer";
import { promises as fsp } from "fs"
import { codeByJudete, judeteByCode } from "./judete.js";

const PAGES = 3; // total 1270
const PER_PAGE = 30; // between 1 and 30
const BAROUL = 1105; // vezi judete.json
const URL = "https://www.ifep.ro/Justice/Lawyers/LawyersPanel.aspx";
const TIMEOUT = 4200;
// let filename = 'avocati.csv';
let filename;

const fetchAvocati = async (barou) => {
  console.log(`Fetching avocaţi from ${judeteByCode[barou]}...`)
  // console.log(`Opening ifep.ro...`)
  // Start a Puppeteer session with:
  // - a visible browser (`headless: false` - easier to debug because you'll see the browser in action)
  // - no default viewport (`defaultViewport: null` - website page will in full width and height)
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
  });
  const page = await browser.newPage();

  // On this new page, wait until the dom content is loaded (HTML is ready to parse)
  await page.goto(URL, {
    waitUntil: "domcontentloaded",
  });

  // Set Items per page dropdown
  await page.select('#MainContent_ddlRecords', PER_PAGE.toString())
  // Set Barou dropdown (if any)
  if(barou) { await page.select('#MainContent_ddlCompany', barou) }

  // timeout
  await new Promise(r => setTimeout(r, TIMEOUT));
  let avocati, totiAvocatii = [], totalPages;

  // Get total number of pages of avocaţi
  totalPages = await page.evaluate(() => {
    const pages = document.querySelector("#MainContent_PagerTop_lblPages").innerText;
    return pages ? pages.split(' ')[3].replace(')', '') : PAGES;
  })
  console.log(`✓ Found ~${PER_PAGE * totalPages} avocaţi ...`)

  for (let i = 1; i <= totalPages; i++) {
    // Get page data
    avocati = await page.evaluate(() => {
      // Fetch the list of avocati from current page
      const avocatiList = document.querySelectorAll(".list-group");

      // Convert the avocatiList to an iterable array, then parse each avocat with its contact info
      return Array.from(avocatiList).map((av) => {
        let email = "", telefon = "", name = "", adresa = "", activ = "", tip = "";
        // activ / inactiv
        if (av.querySelector(".col-md-12 h4 span:nth-child(4)")) {
          activ = av.querySelector(".col-md-12 h4 span:nth-child(4)").innerText;
          activ = activ === '[activ]';
        }
        // avocat stagiar / definitiv
        if (av.querySelector(".col-md-12 span.label")) {
          tip = av.querySelector(".col-md-12 span.label").innerText;
          tip = tip.split('cat ')[1]
        }
        // email
        if (av.querySelector(".text-nowrap")) {
          email = av.querySelector(".text-nowrap").innerText;
        }
        // telefon
        if (av.querySelector(".text-primary")) {
          telefon = av.querySelector(".text-primary").innerText;
        }
        // adresa
        if (av.querySelector(".col-md-12 p")) {
          adresa = av.querySelector(".col-md-12 p").innerText;
          adresa = adresa.split('adresă: ')[1]
          if(adresa) {
            adresa = adresa.replace('”', '').replace('"', '').replace('"', '').replace("'", "").replace("'", "")
          }
        }
        // nume
        if (av.querySelector("font")) {
          name = av.querySelector("font").innerText;
          // let newName = name.split(' ')
          // for (let i = 0; i < newName.length; i++) {
          //   newName[i] = newName[i].toLowerCase();
          //   newName[i] = newName[i][0].toUpperCase() + newName[i].substr(1);
          // }
          // name = newName.join(' ')
          // newName = name.split('-')
          // for (let i = 0; i < newName.length; i++) {
          //   newName[i] = newName[i][0].toUpperCase() + newName[i].substr(1);
          // }
          // name = newName.join('-')
        }
        // tels = uniq(tels);
        return name !== '' ? { name, telefon, email, adresa, activ, tip } : null;
      });
    });
    console.log(`✓ Page ${i} / ${totalPages} complete.`)

    avocati = avocati.filter(a => a != null)
    totiAvocatii = totiAvocatii.concat(avocati);

    // Click on the "Next page" button
    if (i !== totalPages) {
      await page.click("#MainContent_PagerTop_NavNext");
      await new Promise(r => setTimeout(r, TIMEOUT));
    }
  }

  console.log(`Writing to .csv file ...`)
  async function writeCsvAvocati() {
    let csvData = "Activ\tTip\tNume\tTelefonOriginal\tEmail\tAdresa\n";
    totiAvocatii.forEach(ferme => {
      if (ferme && ferme.name) {
        // csvData += (ferme.activ ? ferme.activ : '') + `\t`;
        // csvData += (ferme.tip ? ferme.tip : '') + `\t`;
        // csvData += (ferme.name + `\t`);
        // csvData += (ferme.telefon ? ferme.telefon : '') + `\t`;
        // csvData += (ferme.email ? ferme.email : '') + `\t`;
        // csvData += (ferme.adresa ? ferme.adresa : '') + "\n";
        csvData += ferme.activ + `\t`;
        csvData += ferme.tip + `\t`;
        csvData += ferme.name + `\t`;
        csvData += ferme.telefon + `\t`;
        csvData += ferme.email + `\t`;
        csvData += ferme.adresa + "\n";
      }
    })
    if (!filename) {
      filename = `${judeteByCode[barou].toLowerCase()}-avocaţi.csv`;
    }
    await fsp.writeFile(filename, csvData);
  }

  writeCsvAvocati();
  console.log(`Data saved in file ${filename}`)
  console.log('-----')
  console.log(`✓ Done. Total: ${totiAvocatii.length} avocaţi.`)
  // console.log(totiAvocatii)
  // console.log(totiAvocatii[totiAvocatii.length - 2])
  // Close the browser
  await browser.close();
};

// Start the scraping
// console.log(judeteByCode[BAROUL])
// console.log(process.env.npm_config_judet)
// fetchAvocati(BAROUL.toString());
// fetchAvocati();


// console.log(`Fetching avocaţi from ifep.ro...`)
// if(process.env.npm_config_judet) {
//   Object.keys(codeByJudete).forEach(key => {
//     if(key.toLowerCase() === process.env.npm_config_judet) {
//       console.log(`Fetching avocaţi from ${judeteByCode[codeByJudete[key]]}...`)
//       fetchAvocati(codeByJudete[key])
//     }
//   })
// } else {
//   console.log(`No judet, fetching all avocaţi ...`)
//   fetchAvocati()
// }


// fetch each judet in order
await fetchAvocati('1101');  // Alba",
await fetchAvocati('1102');  // Arad",
await fetchAvocati('1103');  // Argeş",
await fetchAvocati('1104');  // Bacău",
await fetchAvocati('1105');  // Bihor",
await fetchAvocati('1106');  // Bistriţa Năsăud",
await fetchAvocati('1107');  // Botoşani",
await fetchAvocati('1108');  // Braşov",
await fetchAvocati('1109');  // Brăila",
await fetchAvocati('1110');  // Bucureşti",
await fetchAvocati('1111');  // Buzău",
await fetchAvocati('1112');  // Caraş Severin",
await fetchAvocati('1113');  // Călăraşi",
await fetchAvocati('1114');  // Cluj",
await fetchAvocati('1115');  // Constanţa",
await fetchAvocati('1116');  // Covasna",
await fetchAvocati('1117');  // Dâmboviţa",
await fetchAvocati('1118');  // Dolj",
await fetchAvocati('1119');  // Galaţi",
await fetchAvocati('1120');  // Giurgiu",
await fetchAvocati('1121');  // Gorj",
await fetchAvocati('1122');  // Harghita",
await fetchAvocati('1123');  // Hunedoara",
await fetchAvocati('1124');  // Ialomiţa",
await fetchAvocati('1125');  // Iaşi",
await fetchAvocati('1126');  // Ilfov",
await fetchAvocati('1127');  // Maramureş",
await fetchAvocati('1128');  // Mehedinţi",
await fetchAvocati('1129');  // Mureş",
await fetchAvocati('1130');  // Neamţ",
await fetchAvocati('1131');  // Olt",
await fetchAvocati('1132');  // Prahova",
await fetchAvocati('1133');  // Satu Mare",
await fetchAvocati('1134');  // Sălaj",
await fetchAvocati('1135');  // Sibiu",
await fetchAvocati('1136');  // Suceava",
await fetchAvocati('1137');  // Teleorman",
await fetchAvocati('1138');  // Timiş",
await fetchAvocati('1139');  // Tulcea",
await fetchAvocati('1141');  // Vâlcea",
await fetchAvocati('1140');  // Vaslui",
await fetchAvocati('1142');  // Vrancea"