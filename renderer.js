const app = require("electron").remote.app;
const DOM_Tickler = require('./DOM_Tickler');
const storage = require('electron-json-storage');
const Scraper = require('./Scraper');
const Manager = require('./Manager');
const Mailer = require('./Mailer');


const dataPath = storage.getDataPath();
console.log(dataPath);

// Populate email settings field on load
storage.get('email_settings', function (error, data) {
  if (error) throw error;
  to_email.value = data.to_email;
  from_email.value = data.from_email;
  from_password.value = data.from_password;
});

// Activate tab switching
$('.menu .item').tab();
// Activate email settings accordian
$('.ui.accordion').accordion();

// Grab fields from DOM
const to_email = document.querySelector('#to-email');
const from_email = document.querySelector('#from-email');
const from_password = document.querySelector('#from-password');
const save_check = document.querySelector('.save-check');

let the_URL = document.querySelector("#search-url");
let the_name = document.querySelector("#search-name");

const dom_tickler = new DOM_Tickler();

// Called both on application start and when a new search is created.
// If a parameter is passed, it is a saved search from disk, otherwise it is a new search
function start_a_search(data) {

  const date = new Date();

  // Create a new mailer
  const mailer_options = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: from_email.value,
      pass: from_password.value
    }
  }

  const mailer = new Mailer(to_email.value, mailer_options);

  if (typeof data == 'undefined') {
    // New search
    // Data object sent to the scraper
    const form_data = {
      id: the_URL + '::' + date.getTime(),
      name: the_name,
      search_url: the_URL,
      date: date
    }

    // Create a new tab in the UI
    dom_tickler.create_new_UI_tab(form_data);

    // Create the scraper
    const scraper = new Scraper(form_data, mailer);

    // Add to scraper manager
    Manager.scrapers.push({
      scraper: scraper,
      id: the_URL + '::' + date.getTime()
    });

    // Save the search query to persist across app shut down.
    storage.set(form_data.id, form_data, function (error) {
      if (error) throw error;
    });

    // Reset the fields
    document.querySelector("#search-url").value = '';
    document.querySelector("#search-name").value = '';

    // Run the scraper
    scraper.start();

  } else {
    // Search pulled from disk
    // Create a new tab in the UI
    dom_tickler.create_new_UI_tab(data);
    // Create the scraper
    const scraper = new Scraper(data, mailer);

    // Add to scraper manager
    Manager.scrapers.push({
      scraper: scraper,
      id: the_URL + '::' + date.getTime()
    });

    // Run the scraper
    scraper.start();
  }
}

// Load any saved searches from the last session and restart them.
storage.getAll(function (error, data) {
  if (error) throw error;
  for (var key in data) {
    if (key !== "email_settings") {
      start_a_search(data[key]);
    }
  }
});

// Main scrape button event listener
document.querySelector("#submit-search").addEventListener("click", () => {
  event.preventDefault();

  // Grab DOM elements/values
  the_URL = the_URL.value;
  the_name = the_name.value;
  const error_message = document.querySelector("#errors");

  function show_error_message(msg) {
    error_message.querySelector('p').innerHTML = msg;
    error_message.classList.remove('hidden');
  }

  // Error handling
  if (the_URL.length < 1) show_error_message('Searching for nothing will yield poor results.');
  if (the_name.length < 1) show_error_message('A name is required to remember what you were searching for!');
  const bad_email_settings = 'Make sure you fill out the email settings below';
  if (to_email.value.length < 1) show_error_message(bad_email_settings);
  if (from_email.value.length < 1) show_error_message(bad_email_settings);
  if (from_password.value.length < 1) show_error_message(bad_email_settings);

  // If no errors are detected
  if (the_URL.length &&
    the_name.length &&
    to_email.value.length &&
    from_email.value.length &&
    from_password.value.length) {
    error_message.classList.add('hidden');
    console.log('Scraping for: ' + the_name + ' at ' + the_URL);
    
    start_a_search();
  }
});

// Email settings save button event listner
document.querySelector('#email-settings').addEventListener('click', () => {
  event.preventDefault();

  // Save to json file
  storage.set('email_settings', {
    to_email: to_email.value,
    from_email: from_email.value,
    from_password: from_password.value,
  }, function (error) {
    if (error) throw error;
  });

  // Indicate saved to the user
  save_check.classList.add('icon');
  save_check.classList.add('check');
  save_check.parentNode.classList.add('green');
  save_check.nextElementSibling.innerText = "Saved";

  // Close accordian
  setTimeout(() => {
    $('.ui.accordion').accordion('close', 0);
    save_check.classList.remove('icon');
    save_check.classList.remove('check');
    save_check.parentNode.classList.remove('green');
    save_check.nextElementSibling.innerText = "Save";
  }, 500);

});