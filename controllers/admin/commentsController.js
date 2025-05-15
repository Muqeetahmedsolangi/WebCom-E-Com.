const bcrypt = require('bcrypt');
const { User, Role, sequelize } = require('../../models');
const BaseController = require('../BaseController');

class CommentsController extends BaseController {
  constructor() {
    super();
    this.approveComment = this.approveComment.bind(this);
    this.rejectComment = this.rejectComment.bind(this);
    this.deleteComment = this.deleteComment.bind(this);
    
  }
}

module.exports = new CommentsController();
