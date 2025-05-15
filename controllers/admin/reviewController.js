const bcrypt = require('bcrypt');
const { User, Role, sequelize } = require('../../models');
const BaseController = require('../BaseController');

class ReviewController extends BaseController {
  constructor() {
    super();
    this.approveReview = this.approveReview.bind(this);
    this.rejectReview = this.rejectReview.bind(this);
    this.deleteReview = this.deleteReview.bind(this);
  }
}

module.exports = new ReviewController();
