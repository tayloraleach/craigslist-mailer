const app = require("electron").remote.app;
const puppeteer = require("puppeteer");
const DOM_Tickler = require('./DOM_Tickler');

const launchBrowser = async (url) => {

  let all_listings = [];

  try {
    // Launch & Setup
    const browser = await puppeteer.launch({
      args: ["--no-sandbox"],
      headless: true
    });
    const page = await browser.newPage();
    await page.setViewport({
      width: 1920,
      height: 926
    });
    page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');

    await page.goto(url);
    await page.waitForSelector('ul.rows');
    // const dom_listings = await page.$$('li.result-row');

    // for (let x = 0; x < dom_listings.length; x++) {
    //   let obj = {};
    //   const dom_results_info = await page.$('p.results-info');
    //   // console.log(dom_results_info);
    //   all_listings.push(obj);
    // }

    // run page evaluate, if next button, run code beloW?

    const listing_objects = await page.evaluate(() => {
      let listings = [];
      let elms = document.querySelectorAll("li.result-row");
      elms.forEach(element => {
        let json = {};
        const p_result_info = element.querySelector("p.result-info");
        const result_meta = p_result_info.querySelector("span.result-meta");
        try {
          if (p_result_info) {
            json.id = element.getAttribute('data-pid');
            json.title = p_result_info.querySelector("a.result-title").innerText;
            json.href = p_result_info.querySelector("a.result-title").href;
            json.data_time = p_result_info.querySelector("time.result-date").getAttribute('datetime');
          }
          if (result_meta) {
            if (result_meta.querySelector('span.result-price')) {
              json.price = result_meta.querySelector('span.result-price').innerText;
            }
            if (result_meta.querySelector('span.result-hood')) {
              json.hood = result_meta.querySelector('span.result-hood').innerText;
            }
          }
        } catch (e) {
          console.log("Error getting values from the dom...", e);
        }

        // Add listing to the array only if it is not a 'nearby area' result
        try {
          const nearby = result_meta.querySelector('.nearby');
          if (!nearby) {
            listings.push(json);
          }
        } catch (e) {
          console.log("Error removing results from nearby areas", e);
        }
      });
      return listings;
    });

    all_listings.push(...listing_objects);

    await browser.close();

  } catch (err) {
    console.log('SOMETHING WENT WRONG', err);
  }

  document.querySelector("#submit-search").classList.remove('loading');
  console.dir(all_listings);

  // do stuff

};


// Main scrape button event listener
document.querySelector("#submit-search").addEventListener("click", () => {
  event.preventDefault();

  // Get the data from the form
  const the_URL = document.querySelector("#search-url").value;
  const the_name = document.querySelector("#search-name").value;

  console.log('Scraping for: '+ the_name + ' at ' + the_URL);
  document.querySelector("#submit-search").classList.add('loading');

  const form_data = {
    name: the_name,
    url: the_URL,
    date: new Date()
  }

  const dom_tickler = new DOM_Tickler();
  dom_tickler.create_new_UI_tab(form_data);

  // launchBrowser(the_URL);
});


// Activate tab switching
$('.menu .item').tab();


