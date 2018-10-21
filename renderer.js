const app = require("electron").remote.app;
const DOM_Tickler = require('./DOM_Tickler');
const storage = require('electron-json-storage');
const Scraper = require('./Scraper');
const Manager = require('./Manager');
const Mailer = require('./Mailer');


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

// Main scrape button event listener
document.querySelector("#submit-search").addEventListener("click", () => {
  event.preventDefault();

  // Grab DOM elements
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
  const bad_email_settings = 'Make sure you fill out the email settings below';
  if (to_email.value.length < 1) show_error_message(bad_email_settings);
  if (from_email.value.length < 1) show_error_message(bad_email_settings);
  if (from_password.value.length < 1) show_error_message(bad_email_settings);

  if (the_URL.length && the_name.length && to_email.value.length && from_email.value.length && from_password.value.length) {
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

// Email settings save button event listner
document.querySelector('#email-settings').addEventListener('click', () => {
  event.preventDefault();

  // Save to json files
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