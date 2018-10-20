const fs = require('fs');

module.exports = class DOM_Tickler {

  // Need to call this after new tabs are created
  instantiate_tabs() {
    $('.menu .item').tab();
  }

  create_new_UI_tab(data) {
    console.log(data);
    // Remove currently active tab
    remove_class_from_selectors('.top.attached.tabular.menu > *', 'active');
    // Create new tab
    let new_tab = document.createElement("div");
    new_tab.className = "item active";
    new_tab.setAttribute("data-tab", `data-${data.name}`);
    let indicator_icon = document.createElement('i');
    indicator_icon.className = 'circle green icon';
    var tab_text = document.createTextNode(data.name);
    let close_icon = document.createElement('i');
    close_icon.className = 'close icon';
    new_tab.appendChild(indicator_icon);
    new_tab.appendChild(tab_text);
    new_tab.appendChild(close_icon);
    // Add tab to page
    document.querySelector('.top.attached.tabular.menu').appendChild(new_tab);
    // Closing tabs event listeners
    new_tab.addEventListener('click', function (e) {
      // Remove tab and body content when click tab close button
      if (e.target.classList.contains('close')) {
        document.querySelectorAll(`[data-tab]`).forEach((element) => {
          if (element.getAttribute('data-tab') == `data-${data.name}`) element.remove();
        });
        // Set history tab back to active
        document.querySelectorAll('[data-tab]').forEach((x) => {
          if (x.getAttribute('data-tab') == 'scraper') {
            x.classList += ' active';
          }
        })
        // Enable the link again once closed
        document.querySelectorAll('.link-item').forEach((x) => {
          if (this.innerText == x.innerText) {
            x.classList.remove('disabled');
          }
        })
      }
    });

    // Create content body
    (() => {
      // Remove currently active tab
      remove_class_from_selectors('.ui.bottom.attached.tab.segment', 'active');
      // Grab main container
      let main_container = document.querySelector('#main-content-container');
      // Create elements
      let tab_body_container = document.createElement("div");
      let tab_body = document.createElement('div');
      // Set properties
      tab_body_container.className = "ui bottom attached tab active segment";
      tab_body_container.setAttribute("data-tab", `data-${data.name}`);

      tab_body.innerHTML = this.create_tab_body_for_search(data);

      // Add to page
      tab_body_container.appendChild(tab_body);
      main_container.appendChild(tab_body_container);

      // Redefine ability to select tabs
      this.instantiate_tabs();
    })();
  }

  create_tab_body_for_search(data) {
    let content = `
      <div class="ui segment">
        <h5>${data.name}</h5>
        <span>${data.url}</span>
      </div>`;
    return content;
  }

}