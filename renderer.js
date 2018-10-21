const app = require("electron").remote.app;
const DOM_Tickler = require('./DOM_Tickler');
const storage = require('electron-json-storage');
const Scraper = require('./Scraper');
const Manager = require('./Manager');
const Mailer = require('./Mailer');

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

    const date = new Date();

    // Create a new mailer
    const mailer_options = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: 'x',
        pass: 'x'
      }
    }
    const mailer = new Mailer('taylorleach@hotmail.com', mailer_options);

    // Data object sent to the scraper
    const form_data = {
      id: the_URL + '::' + date.getTime(),
      name: the_name,
      search_url: the_URL,
      date: date
    }

    // Create a new tab in the UI
    const dom_tickler = new DOM_Tickler();
    dom_tickler.create_new_UI_tab(form_data);

    // Create the scraper
    const scraper = new Scraper(form_data, mailer);

    // Add to scraper manager
    Manager.scrapers.push({
      scraper: scraper,
      id: the_URL + '::' + date.getTime()
    });

    // Run the scraper
    scraper.start();
  }

});


// Activate tab switching
$('.menu .item').tab();

// Activate email settings accordian
$('.ui.accordion').accordion();