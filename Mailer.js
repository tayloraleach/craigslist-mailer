const node_mailer = require('nodemailer');

module.exports = class Mailer {

  constructor(receiver_email, transport_object, name = "") {
    this.receiver_email = receiver_email;
    this.smtp_transport = node_mailer.createTransport(transport_object);
    this.name = name;
  }

  new_listings_found(results) {
    console.log('Found: ' + results.length + ' new results!');
    const html_body = this.create_email_body_from(results);
    this.send_out_email(html_body);
  }

  create_email_body_from(results) {
    var deals_string = '<div><h2>Check these out...</h2><br>';
    console.log(results);
    for (var deal in results) {
      deals_string += '<div style="width: 100%; display: block; margin-bottom: 10px;">';
      deals_string += '<h3 style="display: inline;">' + results[deal].title + '</h3>';
      if (results[deal].price) deals_string += '<h3 style="display: inline; color: #999";> - (' + results[deal].price + ')</h3>';
      deals_string += '<br>';
      deals_string += '<a href="' + results[deal].href + '">' + results[deal].href + '</a>';
      deals_string += '</div>';
    }
    deals_string += '</div>';
    return deals_string;
  }

  send_out_email(html_string) {
    const mail_options = {
      to: this.receiver_email,
      subject: `New listings found for ${this.name}`,
      html: html_string
    }
    this.smtp_transport.sendMail(mail_options, (error, response) => {
      if (error) return console.log(error);
      console.log("Message sent to: " + mail_options.to);
    });
  }

 send_test_email() {
    const mail_options = {
      to: this.receiver_email,
      subject: 'Test Email',
      html: 'Get ready for some deals.'
    }
    this.smtp_transport.sendMail(mail_options, (error, response) => {
      if (error) return console.log(error);
      console.log("Message sent to: " + mail_options.to);
    });
  }
}