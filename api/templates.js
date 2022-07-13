const express = require('express');
const router = express.Router();
const { client } = require('../config/postmark');
const { buildAlias, getNextVersion } = require('../config/helpers');
const { templates } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * GET /template
 *
 * Retrieves a list of
 * templates from db
 */
router.get('/', async (req, res) => {
  try {
    res.status(200).send({ templates });
  } catch (e) {
    res.status(500).send({ message: e.message });
    console.error(e);
  }
});

/**
 * POST /templates/new
 *
 * Request body {
 *   name             string
 *   templateType     string
 *   layoutTemplate   string
 *   subject          string
 *   htmlBody         string
 *   textBody         string
 * }
 *
 * Creates a new template in postmark,
 * then saves it as the active version in db
 */
router.post('/new', async (req, res) => {
  try {
    // Build alias from name
    const alias = buildAlias(req.body.name, 1);

    // Create template in postmark from req payload
    const template = await client.createTemplate({
      Name: req.body.name,
      Alias: alias,
      TemplateType: req.body.templateType || 'Standard',
      LayoutTemplate: req.body.layoutTemplate || null,
      Subject: req.body.subject,
      HtmlBody: req.body.htmlBody,
      TextBody: req.body.textBody,
    });

    // Save template to db
    const newTemplate = {
      id: template.TemplateId,
      versionId: uuidv4(),
      versionNumber: 1,
      active: true,
      alias,
      createdAt: new Date().toString(),
      ...req.body,
    };

    templates.push(newTemplate);
    res.status(200).send({ template: newTemplate });
  } catch (e) {
    res.status(500).send({ message: e.message });
    console.error(e);
  }
});

/**
 * PUT /templates/edit
 *
 * Request body {
 *   id               integer
 *   subject          string
 *   htmlBody         string
 *   textBody         string
 * }
 *
 * Updates the current template in postmark,
 * then create new active template and
 * sets the previous template to inactive
 */
router.put('/edit', async (req, res) => {
  try {
    // Get current template from db & check if exists
    const currentTemplate = templates.find((t) => t.id === req.body.id && t.active);
    if (!currentTemplate) throw new Error('Current template does not exist');

    // Increment version and build alias
    const versionHistory = templates.filter((t) => t.id === req.body.id);
    const newVersion = getNextVersion(versionHistory);
    const alias = buildAlias(currentTemplate.name, newVersion);

    // Update current template in postmark
    const template = await client.editTemplate(req.body.id, {
      Alias: alias,
      Subject: req.body.subject,
      HtmlBody: req.body.htmlBody,
      TextBody: req.body.textBody,
    });

    // Set current template to inactive in db
    currentTemplate.active = false;

    // Create new active template in db
    const newTemplate = {
      id: template.TemplateId,
      versionId: uuidv4(),
      versionNumber: newVersion,
      active: true,
      alias,
      createdAt: new Date().toString(),
      name: currentTemplate.name,
      templateType: currentTemplate.templateType,
      layoutType: currentTemplate.layoutType,
      ...req.body,
    };

    templates.push(newTemplate);
    res.status(200).send({ template: newTemplate });
  } catch (e) {
    res.status(500).send({ message: e.message });
    console.error(e);
  }
});

/**
 * PUT /templates/revert
 *
 * Request body {
 *   id                integer
 *   targetVersionId   string
 * }
 *
 * Updates the current template in postmark
 * and reverts active template to target
 */
router.put('/revert', async (req, res) => {
  try {
    // Get current template & target template from db
    const currentTemplate = templates.find((t) => t.id === req.body.id && t.active);
    const targetTemplate = templates.find((t) => t.versionId === req.body.targetVersionId);

    // Ensure templates exist and are not the same
    if (!currentTemplate) {
      throw new Error('Current template does not exist');
    } else if (!targetTemplate) {
      throw new Error('Target template does not exist');
    } else if (currentTemplate.versionId === targetTemplate.versionId) {
      throw new Error('Can not revert to current active template');
    } else if (currentTemplate.id !== targetTemplate.id) {
      throw new Error('Can not revert to a different postmark template');
    }

    // Update current template to target in postmark
    await client.editTemplate(req.body.id, {
      Alias: buildAlias(targetTemplate.name, targetTemplate.versionNumber),
      Subject: targetTemplate.subject,
      HtmlBody: targetTemplate.htmlBody,
      TextBody: targetTemplate.textBody,
    });

    // Switch active template
    currentTemplate.active = false;
    targetTemplate.active = true;

    res.status(200).send({ template: targetTemplate });
  } catch (e) {
    res.status(500).send({ message: e.message });
    console.error(e);
  }
});

module.exports = router;
