const puppeteer = require("puppeteer");
const Manager = require('./Manager');

module.exports = class Scraper {

  constructor(data, mailer) {
    this.id = data.id;
    this.name = data.name;
    this.search_url = data.search_url;
    this.date = data.date;
    this.listings_array = []; // Array of items pulled from the page. Is updated upon each scrape.
    this.timer = {}; // Reference to the setTimeout loop.
    this.page = null;
    this.browser = null;
    this.mailer = mailer;
  }

  // Used to prevent the scraping from occuring at a constant interval. Less suspicious!
  randomIntBetweenBounds(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  // Called from the API after the search is deleted from the DB.
  async stop() {
    clearTimeout(this.timer[this.id]);
    this.timer = null;
    await this.browser.close();
  }

  // Main function loop.
  start() {
    this.scrape(this.search_url);

    const rand = this.randomIntBetweenBounds(0, 3600000 / 2);
    // Store the reference to the timeOut and recursilvley call itself at a random interval.
    this.timer[this.id] = setTimeout(() => {
      this.start();
    }, rand);
  }

  check_for_new_listings(results) {
    var self = this; // This has to be before anything else
    // 1st scrape:
    if (this.listings_array.length == 0) {
      // Update the ongoing array with the new scraped data.
      self.listings_array = results;
      console.log('Initial scrape! Got all ' + self.listings_array.length + ' listings from the page.');

      // Every successive scrape:
    } else {
      // Keep a copy of the new scraped results for later.
      var results_copy = results;

      const filtered = results.filter(function (o1) {
        return !self.listings_array.some(function (o2) {
          return o1.id === o2.id; // Filter out new posts (assumes unique id)
        });
      });

      const filtered_no_reposts = filtered.filter(function (o1) {
        return !results.some(function (o2) {
          return o1.id === o2.repost_id; // filter out reposts
        });
      });

      // Update the global array with the copy of the newly scraped data for the next scrape
      self.listings_array = results_copy;

      // Send out email with newly found listings
      if (filtered_no_reposts.length > 0) {
        this.mailer.new_listings_found(filtered_no_reposts);
      } else {
        console.log('Scraped, but nothing new yet!');
      }
    }
  }

  async get_DOM_elements_from_page() {
    // Get all the listings on the page
    return await this.page.evaluate(() => {

      let listings = [];
      let elms = document.querySelectorAll("li.result-row");

      elms.forEach(element => {
        let listing = {};
        const p_result_info = element.querySelector("p.result-info");
        const result_meta = p_result_info.querySelector("span.result-meta");
        try {
          if (p_result_info) {
            listing.id = element.getAttribute('data-pid');
            listing.title = p_result_info.querySelector("a.result-title").innerText;
            listing.href = p_result_info.querySelector("a.result-title").href;
            listing.data_time = p_result_info.querySelector("time.result-date").getAttribute('datetime');
          }
          if (result_meta) {
            if (result_meta.querySelector('span.result-price')) {
              listing.price = result_meta.querySelector('span.result-price').innerText;
            }
            if (result_meta.querySelector('span.result-hood')) {
              listing.hood = result_meta.querySelector('span.result-hood').innerText;
            }
          }
        } catch (e) {
          console.log("Error getting values from the dom...", e);
        }

        // Add listing to the array only if it is not a 'nearby area' result
        try {
          const nearby = result_meta.querySelector('.nearby');
          if (!nearby) {
            listings.push(listing);
          }
        } catch (e) {
          console.log("Error removing results from nearby areas", e);
        }

      });
      return listings;
    });
  }

  // Main scraping function.
  async scrape(url) {

    // if already running.
    if (this.page !== null) {

      await this.page.reload();
      const new_listings_array = await this.get_DOM_elements_from_page();
      this.check_for_new_listings(new_listings_array);

      // First run.
    } else {
      try {
        // Launch & Setup browser
        this.browser = await puppeteer.launch({
          args: ["--no-sandbox"],
          headless: false
        });
        this.page = await this.browser.newPage();
        await this.page.setViewport({
          width: 1920,
          height: 926
        });
        this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');

        await this.page.goto(url);
        await this.page.waitForSelector('ul.rows');

        // Get all the listings on the page
        this.listings_array = await this.get_DOM_elements_from_page();
        console.log(this.listings_array);

      } catch (err) {
        console.log('SOMETHING WENT WRONG', err);
      }
    }
  }
}