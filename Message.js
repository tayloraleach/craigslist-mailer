module.exports = class Message {
  static show(
    element,
    header,
    body = "",
    temporary = false,
    color = "positive"
  ) {
    const elm = document.querySelector(element);
    elm.classList.remove("hidden");
    elm.classList.add(color);
    elm.querySelector(".header").innerHTML = header;
    elm.querySelector(".body").innerHTML = body;
    const dismiss = elm.querySelector(".close.icon");
    if (dismiss) {
      dismiss.addEventListener("click", () => {
        elm.classList.add("hidden");
        elm.querySelector(".header").innerHTML = "";
        elm.querySelector(".body").innerHTML = "";
      });
    }
    if (temporary) {
      setTimeout(() => {
        elm.classList.add("hidden");
      }, 4000);
    }
  }

  static hide(element) {
    document.querySelector(element).classList.add("hidden");
  }
};
