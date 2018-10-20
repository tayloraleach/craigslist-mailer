// UTILITY FUNCTIONS
const fs = require('fs');

const get_timestamp_in_ms = () => {
  return new Date().getTime();
}

const numberWithCommas = (x) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function delete_file(path) {
  fs.unlink(path, (err) => {
    if (err) throw err;
    console.log('successfully deleted');
  });
}

const safe_URL = (x) => {
  return x.replace(/\s+/g, '+').toLowerCase();
}

function readFiles(dirname, onFileContent, onError) {
  fs.readdir(dirname, function (err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function (filename) {
      fs.readFile(dirname + filename, 'utf-8', function (err, content) {
        if (err) {
          onError(err);
          return;
        }
        onFileContent(filename, content);
      });
    });
  });
}

// Get data from json file (in the same directory-current)
function get_data_from_file(file_name) {
  let rawdata = fs.readFileSync(file_name);
  return JSON.parse(rawdata);
}


// DOM manipulation
const remove_class_from_selectors = (str, class_name) => {
  let selectors = document.querySelectorAll(str);
  for (i = 0; i < selectors.length; ++i) {
    selectors[i].classList.remove(class_name);
  }
}