const app = require("electron").remote.app;
const DOM_Tickler = require('./DOM_Tickler');
const storage = require('electron-json-storage');
const node_mailer = require('nodemailer');
const Scraper = require('./Scraper');

// Node Mailer Setup  TODO: SET CRIDENTIALS VIA APP
var smtp_transport = node_mailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
      user: '',
      pass: ''
  }
});

// Main launch function fired when a new search is started
// const launchBrowser = async (url) => {

//   // This is our reference to the listings
//   let all_listings = [];

//   try {
//     // Launch & Setup browser window
//     const browser = await puppeteer.launch({
//       args: ["--no-sandbox"],
//       headless: true
//     });
//     const page = await browser.newPage();
//     await page.setViewport({
//       width: 1920,
//       height: 926
//     });
//     page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');

//     await page.goto(url);
//     await page.waitForSelector('ul.rows');

//     // Get all the listings on the page
//     const listing_objects = await page.evaluate(() => {
//       let listings = [];
//       let elms = document.querySelectorAll("li.result-row");
//       elms.forEach(element => {
//         let json = {};
//         const p_result_info = element.querySelector("p.result-info");
//         const result_meta = p_result_info.querySelector("span.result-meta");
//         try {
//           if (p_result_info) {
//             json.id = element.getAttribute('data-pid');
//             json.title = p_result_info.querySelector("a.result-title").innerText;
//             json.href = p_result_info.querySelector("a.result-title").href;
//             json.data_time = p_result_info.querySelector("time.result-date").getAttribute('datetime');
//           }
//           if (result_meta) {
//             if (result_meta.querySelector('span.result-price')) {
//               json.price = result_meta.querySelector('span.result-price').innerText;
//             }
//             if (result_meta.querySelector('span.result-hood')) {
//               json.hood = result_meta.querySelector('span.result-hood').innerText;
//             }
//           }
//         } catch (e) {
//           console.log("Error getting values from the dom...", e);
//         }

//         // Add listing to the array only if it is not a 'nearby area' result
//         try {
//           const nearby = result_meta.querySelector('.nearby');
//           if (!nearby) {
//             listings.push(json);
//           }
//         } catch (e) {
//           console.log("Error removing results from nearby areas", e);
//         }



//       });
//       return listings;
//     });

//     all_listings.push(...listing_objects);

//     await browser.close();

//   } catch (err) {
//     console.log('SOMETHING WENT WRONG', err);
//   }

//   document.querySelector("#submit-search").classList.remove('loading');
//   console.dir(all_listings);

//   // do stuff

// };


// Main scrape button event listener
document.querySelector("#submit-search").addEventListener("click", () => {
  event.preventDefault();

  // Get the data from the form
  const the_URL = document.querySelector("#search-url").value;
  const the_name = document.querySelector("#search-name").value;

  const error_message = document.querySelector("#errors");

  function show_error_message(msg) {
    error_message.querySelector('p').innerHTML = msg;
    error_message.classList.remove('hidden');
  }

  // Error handling
  if (the_URL.length < 1) show_error_message('Searching for nothing will yield poor results.');
  if (the_name.length < 1) show_error_message('A name is required to remember what you were searching for!');

  if (the_URL.length && the_name.length) {
    error_message.classList.add('hidden');
    console.log('Scraping for: ' + the_name + ' at ' + the_URL);
    document.querySelector("#submit-search").classList.add('loading');

    const date = new Date();

    const form_data = {
      id: the_URL + '::' + date.getTime(),
      name: the_name,
      search_url: the_URL,
      date: date
    }

    const dom_tickler = new DOM_Tickler();
    dom_tickler.create_new_UI_tab(form_data);

    const scraper = new Scraper(form_data);
    scraper.start();
  }


});


// Activate tab switching
$('.menu .item').tab();