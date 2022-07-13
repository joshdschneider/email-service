const express = require('express');
const router = express.Router();
const { users } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * GET /users
 *
 * Retrieve a list of users from db
 */
router.get('/', async (req, res) => {
  try {
    res.status(200).send({ users });
  } catch (e) {
    res.status(500).send({ message: e.message });
    console.error(e);
  }
});

/**
 * POST /users
 *
 * Request body {
 *   firstName  string
 *   lastName   string
 *   email      string
 *   group      string
 * }
 *
 * Creates a new user in the db
 */
router.post('/new', async (req, res) => {
  try {
    const user = {
      id: uuidv4(),
      ...req.body,
    };

    users.push(user);
    res.status(200).send({ user });
  } catch (e) {
    res.status(500).send({ message: e.message });
    console.error(e);
  }
});

module.exports = router;
