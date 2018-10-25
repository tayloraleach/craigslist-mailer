module.exports = class Message {
    static show(element, header, body = '') {
        const elm = document.querySelector(element);
        elm.classList.remove('hidden');
        elm.querySelector('.header').innerHTML = header;
        elm.querySelector('.body').innerHTML = body;
    }

    static remove_all() {
        document.querySelectorAll('.message').forEach(function (e) {
            e.style.display = 'none';
        });
    }
}