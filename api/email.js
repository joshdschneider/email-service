const express = require('express');
const router = express.Router();
const { client, from } = require('../config/postmark');
const { users, emails, templates, clicks } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * GET /email
 *
 * Retrieve all emails
 */
router.get('/', async (req, res) => {
  try {
    res.status(200).send({ emails });
  } catch (e) {
    res.status(500).send({ message: e.message });
    console.error(e);
  }
});

/**
 * GET /email/:id
 *
 * Retrieve a email by id from db
 */
router.get('/:id', async (req, res) => {
  try {
    const email = emails.find((e) => e.id === req.params.id);

    if (!email) {
      res.status(404).send({ message: 'Email not found' });
    } else {
      res.status(200).send({ email });
    }
  } catch (e) {
    res.status(500).send({ message: e.message });
    console.error(e);
  }
});

/**
 * GET /email/:id
 *
 * Retrieve all clicks associated
 * with a specific email
 */
router.get('/:id/clicks', async (req, res) => {
  try {
    const email = emails.find((e) => e.id === req.params.id);

    if (!email) {
      res.status(404).send({ message: 'Email not found' });
    } else {
      const clicksList = clicks.filter((c) => c.emailId === email.id);
      res.status(200).send({ clicks: clicksList });
    }
  } catch (e) {
    res.status(500).send({ message: e.message });
    console.error(e);
  }
});

/**
 * POST /email
 *
 * Request body {
 *   userId           string
 *   templateId       integer
 *   templateModel    object
 *   trackOpens       boolean
 *   trackClicks      string
 * }
 *
 * Sends email to user with postmark
 * and updates the db
 */
router.post('/', async (req, res) => {
  try {
    // Check if user exists
    const user = users.find((u) => u.id === req.body.userId);
    if (!user) throw new Error(`No user found with id ${req.body.userId}`);

    // Send email with postmark
    const email = await client.sendEmailWithTemplate({
      From: from,
      To: user.email,
      TemplateId: req.body.templateId,
      TemplateModel: req.body.templateModel,
      TrackOpens: req.body.trackOpens || true,
      TrackLinks: req.body.trackClicks || 'HtmlAndText',
    });

    // Get current active template from db
    const currentTemplate = templates.find((t) => t.id === req.body.templateId && t.active);

    // Save email to db
    const submittedEmail = {
      id: email.MessageID,
      userId: user.id,
      templateId: req.body.TemplateId,
      templateVersionId: currentTemplate.versionId,
      trackOpens: req.body.trackOpens || true,
      trackClicks: req.body.trackClicks || 'HtmlAndText',
      to: user.email,
      submitted: true,
      submittedAt: email.SubmittedAt,
      errorCode: email.ErrorCode,
      opened: false,
      openedAt: null,
    };

    emails.push(submittedEmail);
    res.status(200).send({ email: submittedEmail });
  } catch (e) {
    res.status(500).send({ error: e.message });
    console.error(e);
  }
});

/**
 * POST /email/open
 *
 * Request body {
 *   MessageID        string
 *   ReceivedAt       integer
 * }
 *
 * Receives webhook data from postmark when
 * an open event occurs, then updates the db
 */
router.post('/open', async (req, res) => {
  try {
    // Check if email exists
    const email = emails.find((e) => e.id === req.body.MessageID);
    if (!email) throw new Error('No email found.');

    // Update email in db
    email.opened = true;
    email.openedAt = req.body.ReceivedAt;
    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
    console.error(e);
  }
});

/**
 * POST /email/click
 *
 * Request body {
 *   MessageID        string
 *   Recipient        string
 *   ReceivedAt       string
 *   ClickLocation    string
 *   OriginalLink     string
 *   Platform         string
 *   UserAgent        string
 *   Geo              object
 *   Client           object
 *   OS               object
 * }
 *
 * Receives webhook data from postmark when
 * a click event occurs, then updates the db
 */
router.post('/click', async (req, res) => {
  try {
    // Check if email exists
    const email = emails.find((e) => e.id === req.body.MessageID);
    if (!email) throw new Error('No email found.');

    // Save click to db
    const click = {
      id: uuidv4(),
      emailId: email.id,
      recipient: req.body.Recipient,
      clickedAt: req.body.ReceivedAt,
      clickLocation: req.body.ClickLocation,
      originalLink: req.body.OriginalLink,
      platform: req.body.Platform,
      userAgent: req.body.UserAgent,
      geo: req.body.Geo,
      client: req.body.Client,
      os: req.body.OS,
    };

    clicks.push(click);
    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
    console.error(e);
  }
});

module.exports = router;
