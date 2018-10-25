module.exports = class Message {

  static show(element, header, body = "") {
    const elm = document.querySelector(element);
    elm.classList.remove("hidden");
    elm.querySelector(".header").innerHTML = header;
    elm.querySelector(".body").innerHTML = body;
  }

  static hide(element) {
    document.querySelector(element).classList.add('hidden');
  }
};
