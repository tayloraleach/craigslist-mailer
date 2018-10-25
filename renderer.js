const app = require("electron").remote.app;
const DOM_Tickler = require('./DOM_Tickler');
const storage = require('electron-json-storage');
const Scraper = require('./Scraper');
const Manager = require('./Manager');
const Mailer = require('./Mailer');
const uuidv1 = require('uuid/v1');
const Message = require('./Message');

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
let the_URL_value;
let the_name_value;

const dom_tickler = new DOM_Tickler();
let mailer      = null;
let mailer_options = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: null,
    pass: null
  }
} 

// Called both on application start and when a new search is created.
// If a parameter is passed, it is a saved search from disk, otherwise it is a new search
function start_a_search(data) {
  console.log('Scraping for: ' + the_name_value + ' at ' + the_URL_value);    

  const date = new Date();
  const id = uuidv1();

  // Set mail settings
  mailer_options.auth.user = from_email.value;
  mailer_options.auth.pass = from_password.value;
  mailer = new Mailer(to_email.value, mailer_options);

  if (typeof data == 'undefined') {
    // New search
    // Data object sent to the scraper
    const form_data = {
      id: id,
      name: the_name_value,
      search_url: the_URL_value,
      date: date
    }

    // Create a new tab in the UI
    dom_tickler.create_new_UI_tab(form_data);

    // Create the scraper
    const scraper = new Scraper(form_data, mailer);

    // Add to scraper manager
    Manager.scrapers.push({
      scraper: scraper,
      id: id
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
      id: id
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
  the_URL_value = the_URL.value;
  the_name_value = the_name.value;

  // Error handling
  if (the_URL_value.length < 1) Message.show('.search-message', 'No URL specified');
  if (the_name_value.length < 1) Message.show('.search-message', 'Please enter a name');
  if (to_email.value.length < 1) Message.show('.search-message', 'Please enter email information below');
  if (from_email.value.length < 1) Message.show('.search-message', 'Please enter email information below');
  if (from_password.value.length < 1) Message.show('.search-message', 'Please enter email information below');

  // If no errors are detected
  if (the_URL_value.length &&
    the_name_value.length &&
    to_email.value.length &&
    from_email.value.length &&
    from_password.value.length) {

    Message.hide('.search-message');

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
  save_check.nextElementSibling.innerText = "Saved";

  // Close accordian
  setTimeout(() => {
    $('.ui.accordion').accordion('close', 0);
    save_check.classList.remove('icon');
    save_check.classList.remove('check');
    save_check.nextElementSibling.innerText = "Save Settings";
  }, 1000);

});


// Send test email button event listner
document.querySelector('#send-test-email').addEventListener('click', () => {
  event.preventDefault();

  if (to_email.value.length < 1) Message.show('.email-message', 'No sender specified');
  if (from_email.value.length < 1) Message.show('.email-message', 'No receiver specified');
  if (from_password.value.length < 1) Message.show('.email-message', 'No receiver password specified');

    // If no errors are detected
    if (to_email.value.length &&
        from_email.value.length &&
        from_password.value.length) {

      // Set mail settings
      mailer_options.auth.user = from_email.value;
      mailer_options.auth.pass = from_password.value;
      mailer = new Mailer(to_email.value, mailer_options);
      
      mailer.send_test_email();

      Message.show('.email-message', `Message sent to ${to_email.value}`, 'Make sure to check your junk mail. You may need to whitelist your sender address if it is a brand new account.', true);
    }
});



