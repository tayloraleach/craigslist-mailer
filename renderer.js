/*
TODO: 
  - Is the scraper actually stopped when you close a tab that was created on application start?
  - Include analysis tab for generating average price (would need seperate interface for collecting just a keyword to search? unsure how it would work)
  - Log messages to each tab with current status with datestamp
*/

// const app = require("electron").remote.app;
const DOM_Tickler = require("./DOM_Tickler");
const storage = require("electron-json-storage");
const Scraper = require("./Scraper");
const Manager = require("./Manager");
const Mailer = require("./Mailer");
const uuidv1 = require("uuid/v1");
const Message = require("./Message");

// Basic setup
const dataPath = storage.getDataPath();
console.log(dataPath);

// Populate email settings field on load
storage.get("email_settings", function(error, data) {
  if (error) throw error;
  to_email.value = data.to_email;
  from_email.value = data.from_email;
  from_password.value = data.from_password;
});

const dom_tickler = new DOM_Tickler();

let mailer = null;

let mailer_options = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: null,
    pass: null
  }
};

// Activate tab switching
$(".menu .item").tab();
// Activate email settings accordian
$(".ui.accordion").accordion();

// Grab fields from DOM
const to_email = document.querySelector("#to-email");
const from_email = document.querySelector("#from-email");
const from_password = document.querySelector("#from-password");
const save_check = document.querySelector(".save-check");

let the_URL = document.querySelector("#search-url");
let the_name = document.querySelector("#search-name");
let the_URL_value;
let the_name_value;

// Load any saved searches from the last session and restart them.
storage.getAll(function(error, data) {
  if (error) throw error;
  for (var key in data) {
    if (key !== "email_settings") {
      start_a_search(data[key]);
    }
  }
});

// Called both on application start and when a new search is created.
// If a parameter is passed, it is a saved search from disk, otherwise it is a new search
function start_a_search(data) {
  const date = new Date();
  const id = uuidv1();

  // Set mail settings
  mailer_options.auth.user = from_email.value;
  mailer_options.auth.pass = from_password.value;

  if (typeof data == "undefined") {
    // New search
    mailer = new Mailer(to_email.value, mailer_options, the_name.value);
    // Data object sent to the scraper
    const form_data = {
      id: id,
      name: the_name_value,
      search_url: the_URL_value,
      date: date
    };
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
    storage.set(form_data.id, form_data, function(error) {
      if (error) throw error;
    });
    // Reset the fields
    document.querySelector("#search-url").value = "";
    document.querySelector("#search-name").value = "";
    // Show logs
    const loadingMessage = `Searching for <b>${the_name_value}</b> at <b>${the_URL_value}</b> ...`;
    Message.show(`[data-message="${id}"]`, "", loadingMessage);
    // Run the scraper
    scraper.start();
  } else {
    // Search pulled from disk
    mailer = new Mailer(to_email.value, mailer_options, data.name);
    // Create a new tab in the UI
    dom_tickler.create_new_UI_tab(data);
    // Create the scraper
    const scraper = new Scraper(data, mailer);
    // Add to scraper manager
    Manager.scrapers.push({
      scraper: scraper,
      id: id
    });
    const loadingMessage = `Searching for <b>${data.name}</b> at <b>${data.search_url}</b> ...`;
    Message.show(`[data-message="${data.id}"]`, "", loadingMessage);
    // Run the scraper
    scraper.start();
  }
}

// Main scrape button event listener
document.querySelector("#submit-search").addEventListener("click", () => {
  event.preventDefault();

  // Grab DOM elements/values
  the_URL_value = the_URL.value;
  the_name_value = the_name.value;

  // Error handling
  if (the_URL_value.length < 1)
    Message.show(".search-message", "No URL specified");
  if (the_name_value.length < 1)
    Message.show(".search-message", "Please enter a name");
  if (to_email.value.length < 1)
    Message.show(".search-message", "Please enter email information below");
  if (from_email.value.length < 1)
    Message.show(".search-message", "Please enter email information below");
  if (from_password.value.length < 1)
    Message.show(".search-message", "Please enter email information below");

  const noErros =
    the_URL_value.length &&
    the_name_value.length &&
    to_email.value.length &&
    from_email.value.length &&
    from_password.value.length;

  if (noErros) {
    Message.hide(".search-message");
    start_a_search();
  }
});

// Email settings save button event listner
document.querySelector("#email-settings").addEventListener("click", () => {
  event.preventDefault();

  // Save to json file
  storage.set(
    "email_settings",
    {
      to_email: to_email.value,
      from_email: from_email.value,
      from_password: from_password.value
    },
    function(error) {
      if (error) throw error;
    }
  );

  // Indicate saved to the user
  save_check.classList.add("icon");
  save_check.classList.add("check");
  save_check.nextElementSibling.innerText = "Saved";

  // Close accordian
  setTimeout(() => {
    $(".ui.accordion").accordion("close", 0);
    save_check.classList.remove("icon");
    save_check.classList.remove("check");
    save_check.nextElementSibling.innerText = "Save Settings";
  }, 2000);
});

// Send test email button event listner
document.querySelector("#send-test-email").addEventListener("click", () => {
  event.preventDefault();
  const msg = x => Message.show(".email-message", x, "", false, "red");
  if (to_email.value.length < 1) {
    msg("No sender specified");
  }
  if (from_email.value.length < 1) {
    msg("No receiver specified");
  }
  if (from_password.value.length < 1) {
    msg("No receiver password specified");
  }
  const noErrors =
    to_email.value.length &&
    from_email.value.length &&
    from_password.value.length;

  if (noErrors) {
    // Set mail settings
    mailer_options.auth.user = from_email.value;
    mailer_options.auth.pass = from_password.value;
    mailer = new Mailer(to_email.value, mailer_options);
    mailer
      .send_test_email()
      .then(res => {
        Message.show(
          ".email-message",
          `Message sent to ${res.envelope.to}`,
          "Make sure to check your junk mail. You may need to whitelist your sender address if it is a brand new account.",
          true
        );
      })
      .catch(e => msg(e));
  }
});
