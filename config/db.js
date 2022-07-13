/*
User {
  id          string
  firstName   string
  lastName    string
  email       string
  group       string
}
*/
let users = [];

/*
Email {
  id                  string
  userId              string
  templateId          integer
  templateVersionId   string
  trackOpens          boolean
  trackClicks         string
  to                  string
  submitted           boolean
  submittedAt         string
  errorCode           integer
  opened              boolean
  openedAt            string
}
*/
let emails = [];

/*
Click {
  id              string
  emailId         string
  recipient       string
  clickedAt       string
  clickLocation   string
  originalLink    string
  platform        string
  userAgent       string
  geo             object
  client          object
  os              object
}
*/
let clicks = [];

/*
Template {
  id                integer
  versionId         string
  versionNumber     integer
  active            boolean
  name              string
  alias             string
  createdAt         string
  templateType      string
  layoutTemplate    string
  subject           string
  htmlBody          string
  textBody          string
}
*/
let templates = [];

module.exports = { users, emails, clicks, templates };
