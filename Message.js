module.exports = class Message {

  static show(element, header, body = "", temporary = false) {
    const elm = document.querySelector(element);
    elm.classList.remove("hidden");
    elm.querySelector(".header").innerHTML = header;
    elm.querySelector(".body").innerHTML = body;
    if (temporary) {
        setTimeout(() => {
            elm.classList.add('hidden');
        }, 4000);
    }
  }

  static hide(element) {
    document.querySelector(element).classList.add('hidden');
  }
};
